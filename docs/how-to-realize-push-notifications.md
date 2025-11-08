# 📱 Push-уведомления - Полная инструкция

## 📋 Содержание

- [Что это такое](#что-это-такое)
- [Как это работает](#как-это-работает)
- [Установка и настройка](#установка-и-настройка)
- [Backend (NestJS)](#backend-nestjs)
- [Frontend](#frontend)
- [Тестирование](#тестирование)
- [API Endpoints](#api-endpoints)

---

## Что это такое

Push-уведомления — это сообщения, которые приходят пользователю **даже когда он не находится на вашем сайте**. Они работают через браузер и отображаются на устройстве пользователя.

**Примеры использования:**
- Напоминание о практике языка
- Уведомление о новом уроке
- Сообщение о достижении

---

## Как это работает

### Простая схема

```

1. Пользователь → "Разрешаю уведомления"
2. Браузер → Создаёт подписку (subscription)
3. Подписка → Отправляется на ваш сервер
4. Сервер → Сохраняет в БД
5. Когда нужно уведомление:
    - Сервер → web-push → Push Service (Google/Mozilla/Apple)
    - Push Service → Браузер
    - Service Worker → Показывает уведомление
```

### Детальная схема

```

┌─────────────┐       1. Запрос разрешения      ┌──────────────┐
│  Браузер    │ ◄──────────────────────────────  │   Ваш сайт   │
│ пользователя│                                  │              │
└─────────────┘       2. "Разрешаю!"             └──────────────┘
│                                                 │
│ 3. Создаёт subscription с endpoint              │
▼                                                 ▼
┌─────────────┐       4. Отправка subscription   ┌──────────────┐
│   Browser   │ ───────────────────────────────► │  NestJS      │
│ Push Service│                                  │  сервер      │
└─────────────┘       5. Сохранение в Prisma     └──────────────┘
▲                                                 │
│                                                 │
│ 7. Получает и показывает                       │
│    уведомление                                 │
│                                                 │
└─────────────  6. Отправка через web-push ◄─────┘

```

---

## Установка и настройка

### 1. Установите зависимости

```

npm install web-push
npm install -D @types/web-push

```

### 2. Сгенерируйте VAPID ключи

```

npx web-push generate-vapid-keys

```

**Результат:**
```

Public Key: BEl62iUYgUivxIkv69yViEuiBIa-Ib9...
Private Key: abc123def456...

```

### 3. Добавьте в `.env`

```

VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9...
VAPID_PRIVATE_KEY=abc123def456...
VAPID_SUBJECT=mailto:your-email@example.com

```

### 4. Обновите Prisma схему

```

model PushSubscription {
id         String   @id @default(uuid())
endpoint   String   @unique @db.Text
p256dh     String   @db.Text
auth       String   @db.Text

userId     String?
user       User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

created_at DateTime @default(now())

@@map("push_subscriptions")
}

```

### 5. Примените миграцию

```

npx prisma migrate dev --name add_push_subscriptions
npx prisma generate

```

---

## Backend (NestJS)

Код уже реализован в вашем проекте:
- `push-notification.service.ts` - бизнес-логика
- `push-notification.controller.ts` - API endpoints
- `push-notification.module.ts` - модуль

**Подключите модуль в `app.module.ts`:**

```

import { PushNotificationModule } from './push-notification/push-notification.module';

@Module({
imports: [
// ...
PushNotificationModule,
],
})
export class AppModule {}

```

---

## Frontend

### Структура файлов

```

public/
├── index.html
├── main.js
└── service-worker.js

```

### `index.html`

```

<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Push Notifications Demo</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    button { padding: 10px 20px; margin: 10px; font-size: 16px; }
  </style>
</head>
<body>
  ```
  <h1>🔔 Push-уведомления</h1>
  ```

  ```
  <button id="subscribe-btn">Подписаться на уведомления</button>
  ```
  ```
  <button id="send-btn">Отправить тестовое уведомление</button>
  ```

  <div id="status"></div>

  <script src="main.js"></script>
</body>
</html>
```

### `main.js`

```

const API_URL = 'http://localhost:3000';

// Регистрируем service worker при загрузке
if ('serviceWorker' in navigator) {
navigator.serviceWorker.register('/service-worker.js')
.then(reg => {
console.log('✅ Service Worker зарегистрирован');
showStatus('Service Worker готов');
})
.catch(err => {
console.error('❌ Ошибка регистрации Service Worker:', err);
showStatus('Ошибка: ' + err.message);
});
}

// Кнопка подписки
document.getElementById('subscribe-btn').addEventListener('click', async () => {
try {
// Проверяем поддержку уведомлений
if (!('Notification' in window)) {
showStatus('❌ Браузер не поддерживает уведомления');
return;
}

    // Запрашиваем разрешение
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await subscribeToPush();
      showStatus('✅ Вы подписались на уведомления!');
    } else {
      showStatus('❌ Вы отклонили разрешение на уведомления');
    }
    } catch (error) {
showStatus('❌ Ошибка: ' + error.message);
}
});

// Кнопка отправки тестового уведомления
document.getElementById('send-btn').addEventListener('click', async () => {
try {
const response = await fetch(`${API_URL}/push-notifications/send`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
title: '🎉 Тестовое уведомление',
body: 'Это работает! Push-уведомления настроены правильно.',
icon: '/icon.png'
})
});

    if (response.ok) {
      showStatus('✅ Уведомление отправлено!');
    } else {
      showStatus('❌ Ошибка отправки');
    }
    } catch (error) {
showStatus('❌ Ошибка: ' + error.message);
}
});

// Подписка на push-уведомления
async function subscribeToPush() {
// Получаем публичный VAPID ключ
const res = await fetch(`${API_URL}/push-notifications/public-key`);
const { publicKey } = await res.json();

// Получаем service worker registration
const registration = await navigator.serviceWorker.ready;

// Создаём подписку
const subscription = await registration.pushManager.subscribe({
userVisibleOnly: true,
applicationServerKey: urlBase64ToUint8Array(publicKey)
});

console.log('📧 Подписка создана:', subscription);

// Отправляем подписку на сервер
await fetch(`${API_URL}/push-notifications/subscribe`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(subscription.toJSON())
});
}

// Конвертация VAPID ключа
function urlBase64ToUint8Array(base64String) {
const padding = '='.repeat((4 - base64String.length % 4) % 4);
const base64 = (base64String + padding)
.replace(/\-/g, '+')
.replace(/_/g, '/');

const rawData = window.atob(base64);
const outputArray = new Uint8Array(rawData.length);

for (let i = 0; i < rawData.length; ++i) {
outputArray[i] = rawData.charCodeAt(i);
}
return outputArray;
}

// Показ статуса
function showStatus(message) {

```
document.getElementById('status').innerHTML = `<p><strong>${message}</strong></p>`;
```

}

```

### `service-worker.js`

```

// Обработка входящих push-уведомлений
self.addEventListener('push', function(event) {
console.log('📬 Получено push-уведомление');

if (event.data) {
const data = event.data.json();

    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: data.badge || '/badge.png',
      vibrate:,[^11][^12]
      data: data.data,
      actions: [
        { action: 'open', title: 'Открыть' },
        { action: 'close', title: 'Закрыть' }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
    }
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', function(event) {
console.log('👆 Клик по уведомлению');

event.notification.close();

if (event.action === 'open') {
const url = event.notification.data?.url || '/';
event.waitUntil(
clients.openWindow(url)
);
}
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', function(event) {
console.log('❌ Уведомление закрыто');
});

```

---

## Тестирование

### 1. Запустите backend

```

npm run start:dev

```

Backend будет доступен на `http://localhost:3000`

### 2. Запустите frontend

```


# Установите http-server (если нет)

npm install -g http-server

# Запустите из папки public

cd public
http-server -p 8080

```

Frontend будет доступен на `http://localhost:8080`

### 3. Откройте браузер

1. Откройте `http://localhost:8080`
2. Нажмите **"Подписаться на уведомления"**
3. Разрешите уведомления в браузере
4. Нажмите **"Отправить тестовое уведомление"**
5. Увидите уведомление! 🎉

### 4. Проверка через DevTools

**Chrome DevTools:**
1. Откройте DevTools (F12)
2. Application → Service Workers → проверьте статус
3. Application → Push Messaging → посмотрите подписку

---

## API Endpoints

### 1. Получение публичного VAPID ключа

```

GET http://localhost:3000/push-notifications/public-key

```

**Ответ:**
```

{
"publicKey": "BEl62iUY..."
}

```

---

### 2. Подписка на уведомления

```

POST http://localhost:3000/push-notifications/subscribe
Content-Type: application/json

{
"endpoint": "https://fcm.googleapis.com/fcm/send/...",
"keys": {
"p256dh": "BNcRdreALRFXTkO...",
"auth": "tBHItJI5svbpez7..."
},
"userId": "user-uuid-опционально"
}

```

**Ответ:**
```

{
"success": true,
"message": "Successfully subscribed to push notifications",
"subscription": {
"id": "uuid",
"endpoint": "...",
"created_at": "2025-11-08T10:00:00.000Z"
}
}

```

---

### 3. Отправка уведомления конкретному пользователю

```

POST http://localhost:3000/push-notifications/send
Content-Type: application/json

{
"title": "Практика казахского языка",
"body": "Пришло время попрактиковать произношение!",
"icon": "/icon.png",
"userId": "user-uuid",
"data": {
"url": "/practice/kazakh"
}
}

```

---

### 4. Отправка уведомления всем

```

POST http://localhost:3000/push-notifications/send
Content-Type: application/json

{
"title": "Новый урок доступен!",
"body": "Проверьте новые материалы"
}

```

**Примечание:** Не указывайте `userId` чтобы отправить всем.

---

### 5. Получение всех подписок

```

GET http://localhost:3000/push-notifications/subscriptions

```

**Ответ:**
```

{
"success": true,
"count": 3,
"subscriptions": [...]
}

```

---

### 6. Получение подписок пользователя

```

GET http://localhost:3000/push-notifications/subscriptions/user/:userId

```

---

### 7. Отписка

```

DELETE http://localhost:3000/push-notifications/unsubscribe?endpoint=https://fcm...

```

---

## 🔧 Troubleshooting

### Уведомления не приходят

**Проверьте:**
1. Service Worker зарегистрирован: DevTools → Application → Service Workers
2. Разрешение дано: Настройки браузера → Уведомления
3. VAPID ключи в `.env` правильные
4. Backend запущен на `localhost:3000`

### Ошибка 410 Gone

Подписка устарела. Сервер автоматически удалит её из БД.

### CORS ошибки

Добавьте в `main.ts`:

```

app.enableCors({
origin: 'http://localhost:8080',
credentials: true,
});

```

---

## 📚 Дополнительно

### Важные термины

- **VAPID** - ключи для идентификации вашего сервера
- **Service Worker** - фоновый скрипт браузера
- **Push Service** - сервис браузера (FCM для Chrome)
- **Subscription** - подписка пользователя

### Поддержка браузерами

✅ Chrome/Edge (через FCM)  
✅ Firefox (через Mozilla Push)  
✅ Safari (через APNs)  
❌ Opera Mini

---

## ✅ Контрольный чек-лист

- [ ] `web-push` установлен
- [ ] VAPID ключи сгенерированы
- [ ] `.env` настроен
- [ ] Prisma миграция применена
- [ ] Backend запущен
- [ ] Service Worker зарегистрирован
- [ ] Разрешение на уведомления получено
- [ ] Тестовое уведомление работает

---

**Готово!** Теперь у вас работают push-уведомления 🎉
```

Сохраните этот текст в файл `PUSH_NOTIFICATIONS_GUIDE.md` в корне вашего проекта.
<span style="display:none">[^1][^10][^2][^3][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://gist.github.com/Jekins/2bf2d0638163f1294637

[^2]: https://skillbox.ru/media/code/yazyk-razmetki-markdown-shpargalka-po-sintaksisu-s-primerami/

[^3]: https://htmlacademy.ru/blog/git/markdown

[^4]: https://doka.guide/tools/markdown/

[^5]: https://ru.hexlet.io/blog/posts/chto-takoe-markdown-i-zachem-on-nuzhen

[^6]: https://skyeng.ru/it-industry/it/polnoye-rukovodstvo-po-sintaksisu-markdown-dlya-novichkov/

[^7]: https://lifehacker.ru/chto-takoe-markdown/

[^8]: https://habitica.fandom.com/ru/wiki/Шпаргалка_%D0%BF%D0%BE_Markdown

[^9]: https://pai-bx.com/wiki/more/2595-the-complete-guide-to-markdown-design-readme-md/

[^10]: https://www.markdownlang.com/ru/

[^11]: https://www.youtube.com/watch?v=sFlPa_Vow3w

[^12]: https://www.reddit.com/r/LocalLLaMA/comments/1m0eq11/whispercpp_nodejs_addon_with_vulkan_support/

