---
applyTo: "**"
---

# Системные инструкции для ChatGPT 5 Mini

Ты — мой помощник-разработчик в Visual Studio Code.  
Моя задача — создать веб-чат на собственном домене, который общается с моим локальным AI Agent в **n8n**, проброшенным через **Cloudflare Tunnel**.

## Контекст проекта:
1. n8n работает локально на Windows и проброшен наружу через Cloudflare Tunnel на мой домен.  
2. У меня есть существующий workflow **Telegram AI Agent**, который использует:  
   - PreProcessing, Settings, Merge, Groq Chat Model, Simple Memory  
   - SerpAPI, OpenWeather API  
3. Я хочу добавить новый канал общения — **веб-чат на моём домене**, созданный в Visual Studio Code.  
4. Веб-чат должен отправлять POST-запросы на n8n Webhook:  
   `POST https://<мой-домен>/webhook/chat`  
   с заголовком `Authorization: Bearer <secret>`,  
   и получать ответ в JSON `{ "reply": "..." }`.  
5. Проект в VS Code должен иметь структуру:  
   ---
   applyTo: "**"

   # Copilot-инструкции (специфично для проекта)

   Цель: быстро сделать AI-агента продуктивным в этом репозитории. Вносите минимальные, проверяемые изменения и поясняйте намерения.

   Кратко (картина в целом)
   - Локальный n8n работает на Windows и проброшен наружу через Cloudflare Tunnel на кастомный домен.
   - Проект реализует веб‑чат: клиент отправляет POST на `https://<домен>/webhook/chat` с заголовком `Authorization: Bearer <secret>` и ожидает JSON `{ "reply": "..." }`.

   Структура проекта (важные директории)
   - `public/`: статика клиента (`index.html`, `style.css`, `chat.js`) — тут реализован `fetch` POST к webhook.
   - `server/`: опциональный прокси (`server/proxy.js`) для CORS/вставки секретов.
   - `package.json`: npm-скрипты (`start`, `dev`, `proxy`).

   Ключевые рабочие процессы
   - Установка зависимостей: `npm install` в корне.
   - Локальная разработка статики: `npm run dev` (добавлять `npx serve public`, если скрипт отсутствует).
   - Отладка webhook: `curl` с `Authorization` против публичного URL Cloudflare.

   Настройка n8n webhook (пошагово)
   1. В n8n добавьте узел `Webhook`:
       - HTTP Method: `POST`
       - Path: `/webhook/chat`
       - Response Mode: `Last Node`
   2. Подключите к Webhook узел `Function` (или другие узлы) и верните объект в формате:
       ```js
       // Код для узла Function в n8n
       return [{ json: { reply: 'Пример ответа от n8n' } }];
       ```
   3. Убедитесь, что вебхук возвращает JSON с полем `reply`. Клиент ожидает именно `{ "reply": "..." }`.

   Примеры запросов и отладки
   Примеры запросов и отладки
   - Конкретные домены для этого проекта: `n8n` — https://n8n.mup.me, фронтенд/чат — https://chat.mup.me

   - Прямой запрос к n8n (требует CORS и передачи секрета из клиента — не рекомендуется в проде):

      curl -v \
         -H "Authorization: Bearer <secret>" \
         -H "Content-Type: application/json" \
         -d '{"message":"привет"}' \
         https://n8n.mup.me/webhook/chat

   - Рекомендуемая схема (чат на `chat.mup.me` → прокси / локальный backend → n8n):

   - Пример `fetch` с фронтенда, который вызывает свой прокси на том же домене (`chat.mup.me`), прокси добавляет Authorization и форвардит на n8n:

      fetch('/webhook/chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ message })
      })
      .then(r => r.json())
      .then(j => console.log(j.reply));

      // proxy (на server/proxy.js) делает fetch к:
      // https://n8n.mup.me/webhook/chat с заголовком Authorization: Bearer <secret>

   Cloudflare Tunnel — быстрые команды (Windows)
   - Установка через winget (Windows):

      winget install --id Cloudflare.Cloudflared -e --source winget

   - Quick tunnel (без сложной регистрации):

      cloudflared tunnel --url http://localhost:5678

   - Именованный туннель (рекомендуется для постоянного домена):

      cloudflared tunnel create my-tunnel
      cloudflared tunnel route dns my-tunnel chat.example.com
      cloudflared tunnel run my-tunnel

   Примечание: именованные туннели требуют аккаунта Cloudflare и записи DNS.

   Прокси для локальной разработки (если нельзя хранить секрет в клиенте)
   - Небольшой `server/proxy.js`, который пробрасывает запрос и добавляет заголовок авторизации:

      const express = require('express');
      const fetch = require('node-fetch');
      const app = express();
      app.use(express.json());
      app.post('/webhook/chat', async (req, res) => {
         const r = await fetch('https://<domain>/webhook/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.WEBHOOK_SECRET },
            body: JSON.stringify(req.body)
         });
         const data = await r.json();
         res.json(data);
      });
      app.listen(3000);

   - Добавьте в `package.json` скрипт: `"proxy": "node server/proxy.js"` и запускайте `npm run proxy`.

   Установка n8n (быстрые варианты)
   - Docker (рекомендуется для изоляции):

      docker run -it --rm -p 5678:5678 n8nio/n8n:latest

   - Либо локально через npx/npm:

      npm install n8n -g
      n8n start

   Особенности проекта и правила агенту
   - Не храните секреты в `public/` — используйте `server/proxy.js` или среду исполнения.
   - При изменениях клиента оставляйте короткое пояснение в PR почему добавлен прокси/CORS.
   - Используйте `public/chat.js`, `server/proxy.js` и `README.md` как первичную точку правок.

   Файлы для проверки перед изменением
   - `public/chat.js` — отправка запроса и парсинг `{reply}`.
   - `server/proxy.js` — пример прокси/вставки заголовка.
   - `package.json` — скрипты `dev`, `start`, `proxy`.

   Если что-то непонятно (домен, политика секретов, разрешён ли прокси), спросите пользователя перед правками.

   Оставьте, пожалуйста, фидбек: нужен ли более подробный пример n8n‑workflow (JSON для импорта), или желаете, чтобы инструкции остались на русском/английском в двух вариантах.
