Вот полный флоу работы с чатом и топиком:

## 1. Получить тему для практики

```bash
# Запрос
curl -X POST http://localhost:3000/chat/topic \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Ресторанда",
    "level": "beginner"
  }'

# Ответ:
{
  "topic": "Ресторанда",
  "level": "beginner",
  "title": "Ресторанда сөйлесу",
  "description": "Ресторанда менюді таңдау және тағам сұрау",
  "startingPrompt": "Ресторанға қош келдіңіз! Бүгін не ішергіңіз келеді?",
  "vocabulary": ["меню", "тағам", "ішімдік", "төлеу", "қызмет"],
  "grammarFocus": ["Объект", "Косвенный падеж -ға/-ге"],
  "estimatedDuration": 20,
  "status": "success"
}
```


## 2. Начать чат с первым сообщением (от ассистента)

```bash
# Первый запрос - ассистент инициирует беседу
curl -X POST http://localhost:3000/chat/practice \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Ресторанда сөйлесуді бастақыла"
      }
    ],
    "topic": "Ресторанда",
    "language": "kk",
    "level": "beginner"
  }'

# Ответ:
{
  "message": "Ресторанға қош келдіңіз! Бүгін не ішергіңіз келеді?",
  "success": true
}
```


## 3. Продолжать диалог (добавлять сообщения в историю)

```bash
# Второй запрос - юзер отвечает
curl -X POST http://localhost:3000/chat/practice \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Ресторанда сөйлесуді бастақыла"
      },
      {
        "role": "assistant",
        "content": "Ресторанға қош келдіңіз! Бүгін не ішергіңіз келеді?"
      },
      {
        "role": "user",
        "content": "Мен қолбасты өтінемін"
      }
    ],
    "topic": "Ресторанда",
    "language": "kk",
    "level": "beginner"
  }'

# Ответ:
{
  "message": "Өте жақсы таңдау! Қолбас өте дәмді. Ішімдік де сұраймыз ба?",
  "success": true
}
```


## 4. Проверить грамматику в ходе беседы

```bash
# Если нужно проверить свою фразу
curl -X POST http://localhost:3000/chat/correct \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Мен қолбасты өтінемін",
    "language": "kk"
  }'

# Ответ:
{
  "original": "Мен қолбасты өтінемін",
  "corrected": "Мен қолбасты сұраймын",
  "explanation": "Өтіну орнына сұрау ғана емес, ал сөйлесу тіл барлығында 'сұрау' қолданылады",
  "status": "success"
}
```


## Frontend TypeScript пример

```typescript
interface TopicData {
  topic: string;
  level: string;
  title: string;
  description: string;
  startingPrompt: string;
  vocabulary: string[];
  grammarFocus: string[];
  estimatedDuration: number;
  status: 'success' | 'error';
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  message: string;
  success: boolean;
}

class ChatPractice {
  private messages: ChatMessage[] = [];
  private currentTopic: TopicData | null = null;

  // 1. Загрузить тему
  async loadTopic(topic: string, level: 'beginner' | 'intermediate' | 'advanced' = 'beginner') {
    const response = await fetch('http://localhost:3000/chat/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, level }),
    });

    this.currentTopic = await response.json();

    if (this.currentTopic?.status === 'success') {
      console.log(`Тақырыпқа қош келдіңіз: ${this.currentTopic.title}`);
      console.log(`Стартовая фраза: ${this.currentTopic.startingPrompt}`);
      console.log(`Сөздік: ${this.currentTopic.vocabulary.join(', ')}`);
      console.log(`Грамматика: ${this.currentTopic.grammarFocus.join(', ')}`);

      // Инициировать чат стартовой фразой
      return this.currentTopic.startingPrompt;
    }
  }

  // 2. Отправить пользовательское сообщение и получить ответ
  async sendMessage(userMessage: string) {
    // Добавить пользовательское сообщение
    this.messages.push({
      role: 'user',
      content: userMessage,
    });

    // Отправить запрос с историей
    const response = await fetch('http://localhost:3000/chat/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: this.messages,
        topic: this.currentTopic?.topic || 'general',
        language: 'kk',
        level: this.currentTopic?.level || 'beginner',
      }),
    });

    const data: ChatResponse = await response.json();

    if (data.success) {
      // Добавить ответ ассистента в историю
      this.messages.push({
        role: 'assistant',
        content: data.message,
      });

      return data.message;
    } else {
      throw new Error(data.message);
    }
  }

  // 3. Проверить грамматику (опционально)
  async checkGrammar(text: string) {
    const response = await fetch('http://localhost:3000/chat/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: 'kk' }),
    });

    return await response.json();
  }

  // 4. Получить историю сообщений
  getHistory() {
    return this.messages;
  }

  // 5. Сбросить диалог
  reset() {
    this.messages = [];
    this.currentTopic = null;
  }
}

// Использование:
const chat = new ChatPractice();

// 1. Загрузить тему
const startingPrompt = await chat.loadTopic('Ресторанда', 'beginner');
console.log(`Ассистент: ${startingPrompt}`);

// 2. Юзер отправляет сообщение
const response1 = await chat.sendMessage('Мен қолбасты сұраймын');
console.log(`Ассистент: ${response1}`);

// 3. Проверить грамматику
const correction = await chat.checkGrammar('Мен қолбасты өтінемін');
console.log(`Түзету: ${correction.corrected}`);

// 4. Продолжить чат
const response2 = await chat.sendMessage('Су да берінішіңіз');
console.log(`Ассистент: ${response2}`);

// 5. История диалога
console.log(chat.getHistory());
```


## Полный пример диалога

```
1️⃣  Загрузить тему:
POST /chat/topic
→ "Ресторанда" + "beginner"

2️⃣  Получить стартовый prompt:
"Ресторанға қош келдіңіз! Бүгін не ішергіңіз келеді?"

3️⃣  Юзер отвечает:
POST /chat/practice
messages: [{role: "user", content: "Мен қолбасты сұраймын"}]
→ "Өте жақсы таңдау!"

4️⃣  Продолжение (история растёт):
POST /chat/practice
messages: [
  {role: "user", content: "Мен қолбасты сұраймын"},
  {role: "assistant", content: "Өте жақсы таңдау!"},
  {role: "user", content: "Су да берінішіңіз"}
]
→ "Су бергеміз. Басқа не?..."

5️⃣  Опционально - проверить грамматику:
POST /chat/correct
→ {original, corrected, explanation}
```


## Ключевой момент 🔑

**Каждый раз отправляй всю историю сообщений!** OpenAI нужен весь контекст:

```typescript
// ❌ НЕПРАВИЛЬНО - только последнее сообщение
messages: [
  { role: "user", content: "Третье сообщение" }
]

// ✅ ПРАВИЛЬНО - полная история
messages: [
  { role: "user", content: "Первое сообщение" },
  { role: "assistant", content: "Ответ 1" },
  { role: "user", content: "Второе сообщение" },
  { role: "assistant", content: "Ответ 2" },
  { role: "user", content: "Третье сообщение" }
]
```

Так OpenAI сможет понять контекст и отвечать релевантно

