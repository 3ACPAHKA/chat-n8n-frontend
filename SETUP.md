# Setup Guide

## Предварительные требования (Prerequisites)

Перед началом работы убедитесь, что у вас установлены:

1. **Node.js** (версия 16 или выше)
    - [Скачать Node.js](https://nodejs.org/)
2. **Cloudflared** (для управления туннелями)
    - Windows: `winget install --id Cloudflare.Cloudflared`
    - MacOS: `brew install cloudflared`
    - Linux: [Инструкция по установке](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
3. **n8n** (локальный сервер автоматизации)
    - `npm install n8n -g` или Desktop версия.

## Установка зависимостей проекта

В корневой директории проекта выполните:

```bash
npm install
```

Это установит необходимые пакеты для разработки (vite, serve и др.).

## Настройка окружения

1. **Авторизация Cloudflare**
    Выполните команду и следуйте инструкциям в браузере:

    ```bash
    cloudflared tunnel login
    ```

2. **Настройка туннелей**
    Проект уже содержит файлы конфигурации:
    - `config.yml` (для чата)
    - `n8n-config.yml` (для n8n)

    Вам потребуется подставить свои `tunnel` UUID и пути к `credentials-file`, если вы пересоздаете туннели. См. `DEPLOYMENT.md` для деталей.
