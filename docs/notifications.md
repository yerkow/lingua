# Push-уведомления API - Тестирование в Postman

## 1. Получение публичного VAPID ключа

**Метод:** `GET`  
**URL:** `http://localhost:3000/push-notifications/public-key`

**Ответ:**

```

{
"publicKey": "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
}

```

---

## 2. Подписка на push-уведомления

**Метод:** `POST`  
**URL:** `http://localhost:3000/push-notifications/subscribe`  
**Content-Type:** `application/json`

**Body:**
```

{
"endpoint": "https://fcm.googleapis.com/fcm/send/c9VC_...",
"keys": {
"p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM=",
"auth": "tBHItJI5svbpez7KI4CCXg=="
},
"userId": "user-uuid-здесь"
}

```

**Ответ:**
```

{
"success": true,
"message": "Successfully subscribed to push notifications",
"subscription": {
"id": "subscription-uuid",
"endpoint": "https://fcm.googleapis.com/fcm/send/...",
"userId": "user-uuid",
"created_at": "2025-11-08T10:00:00.000Z"
}
}

```

---

## 3. Отправка уведомления конкретному пользователю

**Метод:** `POST`  
**URL:** `http://localhost:3000/push-notifications/send`  
**Content-Type:** `application/json`

**Body:**
```

{
"title": "Практика казахского языка",
"body": "Пришло время попрактиковать произношение!",
"icon": "/icon.png",
"badge": "/badge.png",
"userId": "user-uuid-здесь",
"data": {
"url": "/practice/kazakh",
"lessonId": "123"
}
}

```

**Ответ:**
```

{
"success": true,
"message": "Notification sent"
}

```

---

## 4. Отправка уведомления всем подписчикам

**Метод:** `POST`  
**URL:** `http://localhost:3000/push-notifications/send`  
**Content-Type:** `application/json`

**Body (без userId):**
```

{
"title": "Новый урок доступен!",
"body": "Проверьте новые материалы по казахскому языку",
"icon": "/icon.png",
"data": {
"url": "/lessons/new"
}
}

```

**Ответ:**
```

{
"success": true,
"message": "Notification sent"
}

```

---

## 5. Получение всех подписок

**Метод:** `GET`  
**URL:** `http://localhost:3000/push-notifications/subscriptions`

**Ответ:**
```

{
"success": true,
"count": 3,
"subscriptions": [
{
"id": "uuid-1",
"endpoint": "https://fcm.googleapis.com/fcm/send/...",
"userId": "user-uuid-1",
"user": {
"id": "user-uuid-1",
"login": "testuser",
"fullname": "Test User"
},
"created_at": "2025-11-08T10:00:00.000Z"
}
]
}

```

---

## 6. Получение подписок пользователя

**Метод:** `GET`  
**URL:** `http://localhost:3000/push-notifications/subscriptions/user/:userId`

**Query Params:**
- `userId` = user-uuid-здесь

**Пример:**
```

GET http://localhost:3000/push-notifications/subscriptions/user/123e4567-e89b-12d3-a456-426614174000

```

**Ответ:**
```

{
"success": true,
"count": 2,
"subscriptions": [
{
"id": "sub-uuid-1",
"endpoint": "https://fcm.googleapis.com/fcm/send/...",
"userId": "user-uuid",
"created_at": "2025-11-08T10:00:00.000Z"
}
]
}

```

---

## 7. Отписка от push-уведомлений

**Метод:** `DELETE`  
**URL:** `http://localhost:3000/push-notifications/unsubscribe`

**Query Params:**
- `endpoint` = https://fcm.googleapis.com/fcm/send/...

**Пример:**
```

DELETE http://localhost:3000/push-notifications/unsubscribe?endpoint=https://fcm.googleapis.com/fcm/send/c9VC_...

```

**Ответ:**
```

{
"success": true,
"message": "Successfully unsubscribed from push notifications"
}

```

---

## Как тестировать в Postman

### Метод 2 - Подписка:
1. Создайте новый запрос → POST
2. URL: `http://localhost:3000/push-notifications/subscribe`
3. Body → raw → JSON
4. Вставьте JSON из примера
5. Send

### Метод 3 - Отправка уведомления пользователю:
1. POST → `http://localhost:3000/push-notifications/send`
2. Body → raw → JSON
3. Укажите `userId` конкретного пользователя
4. Send

### Метод 4 - Отправка всем:
1. POST → `http://localhost:3000/push-notifications/send`
2. Body → raw → JSON
3. **НЕ указывайте** `userId` (или удалите это поле)
4. Send

### Метод 7 - Отписка:
1. DELETE → `http://localhost:3000/push-notifications/unsubscribe`
2. Params → Query Params
3. Добавьте: `endpoint` = `ваш-endpoint-из-подписки`
4. Send
```
