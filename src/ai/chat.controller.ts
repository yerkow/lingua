import { Body, Controller, Post } from '@nestjs/common';
import { OpenaiService } from './openai.service';

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  topic?: string;
  language?: 'kk' | 'ru' | 'en';
  level?: 'beginner' | 'intermediate' | 'advanced';
}

interface ChatResponse {
  message: string;
  success: boolean;
  tokens?: number;
}

@Controller('chat')
export class ChatController {
  constructor(private openaiService: OpenaiService) {}

  /**
   * Основной эндпоинт для чата практики
   */
  @Post('practice')
  async chatPractice(@Body() request: ChatRequest): Promise<ChatResponse> {
    try {
      const topicConfig = {
        topic: request.topic || 'general',
        language: request.language || 'kk',
        level: request.level || 'beginner',
      };

      const message = await this.openaiService.chat(request.messages, topicConfig);

      return {
        message,
        success: true,
      };
    } catch (error) {
      return {
        message: 'Қате орын алды. Кейін қайтадан талап етіңіз.',
        success: false,
      };
    }
  }

  /**
   * Streaming чат для реального времени
   */
  @Post('practice-stream')
  async chatPracticeStream(@Body() request: ChatRequest) {
    const topicConfig = {
      topic: request.topic || 'general',
      language: request.language || 'kk',
      level: request.level || 'beginner',
    };

    return this.openaiService.chatStream(request.messages, topicConfig);
  }

  /**
   * Проверка грамматики
   */
  @Post('correct')
  async correctText(
    @Body('text') text: string,
    @Body('language') language: 'kk' | 'ru' | 'en' = 'kk',
  ) {
    try {
      if (!text || text.trim().length === 0) {
        return {
          original: '',
          corrected: '',
          explanation: '',
          status: 'error',
          message: 'Сөйлем бос болмауы керек',
        };
      }

      if (text.length > 500) {
        return {
          original: text,
          corrected: '',
          explanation: '',
          status: 'error',
          message: 'Сөйлем 500 символдан ұзын болуы мүмкін емес',
        };
      }

      const result = await this.openaiService.correctText(text, language);

      return {
        ...result,
        status: 'success',
      };
    } catch (error) {
      return {
        original: text,
        corrected: '',
        explanation: `Қатеа орын алды: ${error.message}`,
        status: 'error',
        message: 'Сөйлемді түзету мүмкін болмады',
      };
    }
  }

  /**
   * Генерация стартовой темы
   */
  @Post('topic')
  async generateTopic(
    @Body('topic') topic: string,
    @Body('level') level: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
  ) {
    try {
      if (!topic || topic.trim().length === 0) {
        return {
          topic: '',
          level: '',
          title: '',
          description: '',
          startingPrompt: '',
          vocabulary: [],
          grammarFocus: [],
          estimatedDuration: 0,
          status: 'error',
          error: 'Тақырыпты көрсету қажет',
        };
      }

      const result = await this.openaiService.generateTopic(topic, level);

      return {
        ...result,
        status: 'success',
      };
    } catch (error) {
      return {
        topic,
        level,
        title: '',
        description: '',
        startingPrompt: '',
        vocabulary: [],
        grammarFocus: [],
        estimatedDuration: 0,
        status: 'error',
        error: `Тақырыпты құру мүмкін болмады: ${error.message}`,
      };
    }
  }

}
