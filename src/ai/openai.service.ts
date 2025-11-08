import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Logger } from '@nestjs/common';
import * as fs from "node:fs";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatTopicConfig {
  topic: string;
  language: 'kk' | 'ru' | 'en';
  level: 'beginner' | 'intermediate' | 'advanced';
}

@Injectable()
export class OpenaiService {
  private openAi: OpenAI;
  private readonly logger = new Logger(OpenaiService.name);

  // Системные подсказки на казахском
  private readonly systemPrompts = {
    kk: `Сен қазақ тілін үйретіп тұрған ІЖ ассистентісің. Сенің міндетің:
1. Қазақ тіліндегі сөйлесу практикасын ұйғарту
2. Қолданушының сөйлемдерін түзету және кеңес беру
3. Тек қазақ тіліне жауап беру
4. Оңай және орынды мысалдар беру
5. Өндіктеген тілдік мәселелерін түсіндіру
6. Сөз қоры өстіру үшін жаңа сөздер ұсыну

Сөйлесу практикасын ынамдылық пен қиындықты балансыра отырып, қызықты етіп сұраулар қойыңыз.`,

    ru: `Ты ассистент для изучения казахского языка. Твои задачи:
1. Проводить диалоговую практику на казахском языке
2. Исправлять ошибки и давать советы
3. Отвечать только на казахском языке
4. Давать понятные примеры на русском при необходимости
5. Помогать пополнять словарный запас
6. Задавать интересные вопросы для практики

Делай практику достаточно сложной, но понятной.`,

    en: `You are a Kazakh language learning assistant. Your tasks:
1. Conduct conversational practice in Kazakh
2. Correct errors and provide guidance
3. Respond primarily in Kazakh
4. Provide English examples when needed for clarity
5. Help expand vocabulary
6. Ask engaging questions for practice

Keep the practice balanced between challenge and comprehension.`,
  };

  constructor(private configService: ConfigService) {
    this.openAi = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  /**
   * Базовое распознавание речи
   */
  async transcribeAudio(
    file: Express.Multer.File,
    language?: string,
  ): Promise<string> {
    try {
      const tempFilePath = `/tmp/${Date.now()}-${file.originalname}`;
      fs.writeFileSync(tempFilePath, file.buffer);

      const transcription = await this.openAi.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: language,
        response_format: 'text',
        temperature: 0,
      });

      fs.unlinkSync(tempFilePath);

      return transcription as unknown as string;
    } catch (error) {
      console.error('Ошибка транскрибации:', error);
      throw new Error(`Не удалось распознать аудио: ${error.message}`);
    }
  }

  /**
   * Коррекция текста через GPT
   */
  async correctTranscription(text: string, language: string): Promise<{
    correctedText: string;
    errors: string[];
    confidence: string;
  }> {
    const systemPrompts = {
      kk: `Ты редактор казахского языка. Твоя задача:
1. Исправить орфографические ошибки
2. Исправить грамматические ошибки
3. Исправить неправильное использование заимствованных слов на корректные казахские эквиваленты
4. Исправить окончания и суффиксы согласно нормам казахского языка

Верни JSON в формате:
{
  "correctedText": "исправленный текст",
  "errors": ["список найденных ошибок"],
  "confidence": "высокая/средняя/низкая"
}`,
      ru: `Ты редактор русского языка. Твоя задача:
1. Исправить орфографические ошибки
2. Исправить грамматические ошибки
3. Улучшить пунктуацию
4. Сохранить смысл и стиль оригинала

Верни JSON в формате:
{
  "correctedText": "исправленный текст",
  "errors": ["список найденных ошибок"],
  "confidence": "высокая/средняя/низкая"
}`,
      en: `You are an English language editor. Your task:
1. Correct spelling errors
2. Fix grammatical mistakes
3. Improve punctuation
4. Preserve original meaning and style

Return JSON in format:
{
  "correctedText": "corrected text",
  "errors": ["list of found errors"],
  "confidence": "high/medium/low"
}`,
    };

    try {
      const response = await this.openAi.chat.completions.create({
        model: 'gpt-4o-mini', // Используем gpt-4o-mini для экономии
        temperature: 0, // Минимальная креативность
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompts[language] || systemPrompts['en'],
          },
          {
            role: 'user',
            content: `Исправь следующий текст:\n\n${text}`,
          },
        ],
      });

      const result = JSON.parse(<string>response.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('Ошибка коррекции:', error);
      // В случае ошибки возвращаем оригинальный текст
      return {
        correctedText: text,
        errors: [],
        confidence: 'low',
      };
    }
  }

  /**
   * Распознавание с детальным ответом (с временными метками)
   */
  async transcribeAudioDetailed(
    file: Express.Multer.File,
    language?: string,
  ) {
    try {
      const tempFilePath = `/tmp/${Date.now()}-${file.originalname}`;
      fs.writeFileSync(tempFilePath, file.buffer);

      const transcription = await this.openAi.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: language,
        response_format: 'verbose_json', // Включает временные метки
        timestamp_granularities: ['word', 'segment'],
      });

      fs.unlinkSync(tempFilePath);

      return transcription;
    } catch (error) {
      console.error('Ошибка транскрибации:', error);
      throw new Error(`Не удалось распознать аудио: ${error.message}`);
    }
  }

  /**
   * Генерация речи из текста через OpenAI TTS API
   * @param text Текст для преобразования в речь
   * @param voice Голос для синтеза (по умолчанию 'alloy')
   * @returns Buffer с MP3 данными
   */
  async generateSpeech(text: string, voice: string = 'alloy') {
    const mp3 = await this.openAi.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
      speed: 1.0,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  }

  /**
   * Основной чат с поддержкой разных тематик и языков
   */
  async chat(
    messages: ChatMessage[],
    topicConfig?: ChatTopicConfig,
  ): Promise<string> {
    try {
      // Если это первое сообщение, добавляем системную подсказку
      const messagesWithSystem = this.prepareMessages(messages, topicConfig);

      const response = await this.openAi.chat.completions.create({
        model: this.configService.get('OPENAI_MODEL', 'gpt-4-turbo'),
        messages: messagesWithSystem,
        temperature: 0.8, // Более творческие ответы для диалога
        max_tokens: 500, // Для чата практики не нужно слишком длинных ответов
        top_p: 0.9,
      });

      const content = response.choices[0]?.message?.content || '';
      this.logger.log(`Chat response generated for topic: ${topicConfig?.topic || 'general'}`);

      return content;
    } catch (error) {
      this.logger.error(`OpenAI chat error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Streaming для более быстрого UI обновления
   */
  async chatStream(
    messages: ChatMessage[],
    topicConfig?: ChatTopicConfig,
  ) {
    try {
      const messagesWithSystem = this.prepareMessages(messages, topicConfig);

      const stream = await this.openAi.chat.completions.create({
        model: this.configService.get('OPENAI_MODEL', 'gpt-4-turbo'),
        messages: messagesWithSystem,
        temperature: 0.8,
        max_tokens: 500,
        stream: true,
      });

      this.logger.log(`Streaming started for topic: ${topicConfig?.topic || 'general'}`);

      return stream;
    } catch (error) {
      this.logger.error(`OpenAI stream error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Проверка грамматики и исправление
   */
  async correctText(text: string, language: 'kk' | 'ru' | 'en' = 'kk'): Promise<{
    original: string;
    corrected: string;
    explanation: string;
  }> {
    try {
      const correctionPrompt = language === 'kk'
        ? `Берілген қазақ тілінің сөйлемін тексер және түзет. Нәтижені өзгеше форматта ұсын:

ОРИГИНАЛ: [оригинал сөйлем]
ТҮЗЕТІЛГЕН: [түзетілген сөйлем]
ТҮСІНДІРУ: [түзету түсіндірмесі]

Сөйлем: "${text}"`
        : `Проверь казахское предложение и исправь его. Ответь в формате:

ОРИГИНАЛ: [исходное предложение]
ИСПРАВЛЕННОЕ: [исправленное предложение]
ОБЪЯСНЕНИЕ: [объяснение исправления]

Предложение: "${text}"`;

      const response = await this.openAi.chat.completions.create({
        model: this.configService.get('OPENAI_MODEL', 'gpt-4-turbo'),
        messages: [
          {
            role: 'system',
            content: 'Сен қазақ тіліне сарапшысың. Дәл және қысқа түзету құрт бер. Форматты сақта.',
          },
          {
            role: 'user',
            content: correctionPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content || '';
      const parsed = this.parseCorrection(content, language);

      this.logger.log(`Text corrected for: ${text.substring(0, 30)}...`);

      return {
        original: text,
        corrected: parsed.corrected,
        explanation: parsed.explanation,
      };
    } catch (error) {
      this.logger.error(`Text correction error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Парсер результата коррекции
   */
  private parseCorrection(
    content: string,
    language: 'kk' | 'ru' | 'en',
  ): { corrected: string; explanation: string } {
    try {
      // Варианты ключей в зависимости от языка
      const keys = language === 'kk'
        ? {
          corrected: ['ТҮЗЕТІЛГЕН', 'КОРРЕКТІЛГЕН', 'ЖӨНДЕЛГЕН'],
          explanation: ['ТҮСІНДІРУ', 'ТҮСІНІК', 'СҰРАҚ'],
        }
        : {
          corrected: ['ИСПРАВЛЕННОЕ', 'ИСПРАВЛЕНО', 'ПРАВИЛЬНОЕ'],
          explanation: ['ОБЪЯСНЕНИЕ', 'ПОЯСНЕНИЕ', 'КОММЕНТАРИЙ'],
        };

      // Функция поиска значения по ключу
      const findValue = (lines: string[], keyList: string[]): string => {
        for (const line of lines) {
          for (const key of keyList) {
            const regex = new RegExp(`${key}\\s*[:=]\\s*(.+?)(?=$|\\n)`, 'i');
            const match = line.match(regex);
            if (match) {
              return match[1].trim().replace(/^["']|["']$/g, '');
            }
          }
        }
        return '';
      };

      const lines = content.split('\n').filter(l => l.trim());

      const corrected = findValue(lines, keys.corrected);
      const explanation = findValue(lines, keys.explanation);

      // Если парсинг не удался, возвращаем исходный контент
      if (!corrected || !explanation) {
        this.logger.warn(`Failed to parse correction, using raw content`);
        return {
          corrected: corrected || content.split('\n')[0],
          explanation: explanation || content,
        };
      }

      return {
        corrected: corrected.substring(0, 200), // Лимит на длину
        explanation: explanation.substring(0, 500), // Лимит на объяснение
      };
    } catch (error) {
      this.logger.error(`Parsing error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Генерация структурированной темы для практики
   */
  async generateTopic(
    topic: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
  ): Promise<{
    topic: string;
    level: string;
    title: string;
    description: string;
    startingPrompt: string;
    vocabulary: string[];
    grammarFocus: string[];
    estimatedDuration: number; // в минутах
  }> {
    try {
      const levelDescriptions = {
        beginner: 'жеңіл (A1-A2)',
        intermediate: 'орташа (B1-B2)',
        advanced: 'қиын (C1-C2)',
      };

      const prompt = `Қазақ тіліндегі "${topic}" тақырыбы бойынша ${levelDescriptions[level]} деңгейінде сөйлесу практикасын құр.

Ответ в точном JSON формате (только JSON, без доп. текста):
{
  "title": "Тақырыптың атауы",
  "description": "Тақырыптың қысқа сипаттамасы (1-2 сөйлем)",
  "startingPrompt": "Сөйлесуді бастау үшін қызықты сұрау",
  "vocabulary": ["сөз1", "сөз2", "сөз3", "сөз4", "сөз5"],
  "grammarFocus": ["грамматика1", "грамматика2"],
  "estimatedDuration": 15
}`;

      const response = await this.openAi.chat.completions.create({
        model: this.configService.get('OPENAI_MODEL', 'gpt-4-turbo'),
        messages: [
          {
            role: 'system',
            content: 'Сен қазақ тіліне сарапшысың. Тек жарамды JSON ғана қайтар. Өзге мәтін қоспа.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 600,
      });

      const content = response.choices[0]?.message?.content || '';
      const parsed = this.parseTopicResponse(content);

      this.logger.log(`Topic generated: ${topic} (${level})`);

      return {
        topic,
        level,
        ...parsed,
      };
    } catch (error) {
      this.logger.error(`Topic generation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Парсер ответа для генерации темы
   */
  private parseTopicResponse(content: string): {
    title: string;
    description: string;
    startingPrompt: string;
    vocabulary: string[];
    grammarFocus: string[];
    estimatedDuration: number;
  } {
    try {
      // Находим JSON в ответе (может быть со скобками или без)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON not found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Валидация полей
      return {
        title: parsed.title || 'Тақырып',
        description: parsed.description || '',
        startingPrompt: parsed.startingPrompt || '',
        vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary.slice(0, 10) : [],
        grammarFocus: Array.isArray(parsed.grammarFocus) ? parsed.grammarFocus.slice(0, 5) : [],
        estimatedDuration: parseInt(parsed.estimatedDuration) || 15,
      };
    } catch (error) {
      this.logger.error(`Failed to parse topic response: ${error.message}`);
      // Fallback на дефолтные значения
      return {
        title: 'Тақырып',
        description: 'Практика темасы',
        startingPrompt: 'Сөйлесіңіз',
        vocabulary: [],
        grammarFocus: [],
        estimatedDuration: 15,
      };
    }
  }


  /**
   * Подготовка сообщений с системной подсказкой
   */
  private prepareMessages(
    messages: ChatMessage[],
    topicConfig?: ChatTopicConfig,
  ): ChatMessage[] {
    // Проверяем, есть ли уже системная подсказка
    const hasSystem = messages.some(m => m.role === 'system');

    if (hasSystem) {
      return messages;
    }

    // Выбираем язык для системной подсказки
    const language = topicConfig?.language || 'kk';
    const systemPrompt = this.systemPrompts[language];

    // Добавляем тему, если она есть
    let finalPrompt = systemPrompt;
    if (topicConfig?.topic) {
      finalPrompt += `\n\nТақырып: "${topicConfig.topic}"`;
    }

    return [
      {
        role: 'system',
        content: finalPrompt,
      },
      ...messages,
    ];
  }
}
