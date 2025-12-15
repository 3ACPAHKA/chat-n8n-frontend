# Deployment Guide

Этот документ описывает процесс локального развертывания фронтенда и настройки туннелей Cloudflare для доступа к `chat.mup.me` и `n8n.mup.me`.

## Требования

- **Node.js**: версии 14+
- **Cloudflared**: установленный и авторизованный (`cloudflared login`)
- **n8n**: установленный локально (Desktop или npm версия)

## Структура Портов

| Сервис | Локальный адрес | Публичный адрес | Примечание |
|--------|-----------------|-----------------|------------|
| **Chat Frontend** | `http://localhost:3000` | `https://chat.mup.me` | Запускается через `npm run dev` (serve) |
| **n8n** | `https://localhost:443` | `https://n8n.mup.me` | n8n работает на 443 порту (HTTP трафик, но порт HTTPS) |

## Инструкция по запуску (С нуля)

Для полноценной работы системы необходимо запустить **3 процесса в параллельных терминалах**.

### 1. Запуск Фронтенда (Chat)

В папке проекта запустите статический сервер:

```powershell
npm run dev
# Ожидаемый вывод: Serving! - Local: http://localhost:3000
```

### 2. Запуск Туннелей

В проекте настроены два конфигурационных файла для разделения трафика.

#### Туннель для Чата (`chat.mup.me`)

```powershell
cloudflared tunnel --config chat-config.yml run
```

- **Config**: `chat-config.yml`
- **Маршрут**: `chat.mup.me` -> `http://127.0.0.1:3000`
- **UUID**: `52c25962-...`

#### Туннель для n8n (`n8n.mup.me`)

```powershell
cloudflared tunnel --config n8n-config.yml run
```

- **Config**: `n8n-config.yml`
- **Маршрут**: `n8n.mup.me` -> `http://localhost:443`
- **UUID**: `b81693ba-...`
- **Особенность**: Использует `http` протокол на порту `443` для корректной работы с локальным n8n (binding issues).

### 3. Запуск n8n

Убедитесь, что приложение n8n запущено (обычно через Desktop иконку или `n8n start`) и занимает порт **443**.

## Диагностика (Troubleshooting)

### Ошибка 502 Bad Gateway

- **Chat**: Проверьте, что `npm run dev` запущен и доступен по `http://localhost:3000`.
- **n8n**: Проверьте, что n8n запущен.
  - Попробуйте открыть `https://localhost:443` в браузере (игнорируя предупреждение безопасности).
  - Если порт занят другим приложением, измените порт n8n или обновите `n8n-config.yml`.

### Ошибка 1033 (Tunnel Error)

- Означает, что процесс `cloudflared` упал или потерял связь.
- Перезапустите соответствующую команду туннеля.
- Если запущено несколько копий процесса, убейте их все: `taskkill /F /IM cloudflared.exe` и запустите заново.

## Конфигурация Туннелей

### `chat-config.yml` (Chat)

```yaml
tunnel: 52c25962-6826-44ad-b172-7460fd4a1c6b
credentials-file: ...
ingress:
  - hostname: chat.mup.me
    service: http://127.0.0.1:3000
  - service: http_status:404
```

### `n8n-config.yml` (n8n)

```yaml
tunnel: b81693ba-7c3e-4b8d-9260-5b84ee2f9548
credentials-file: ...
ingress:
  - hostname: n8n.mup.me
    service: http://localhost:443
  - service: http_status:404
```
