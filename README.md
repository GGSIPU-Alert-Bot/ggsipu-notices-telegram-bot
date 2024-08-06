# GGSIPU Notices Telegram Bot

This Telegram bot is designed to fetch and broadcast notices from GGSIPU (Guru Gobind Singh Indraprastha University) to subscribed Telegram channels or groups. It also integrates with a separate WhatsApp bot via webhooks for broader dissemination of notices.

## Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Webhook Integration](#webhook-integration)
7. [Deployment](#deployment)
8. [Contributing](#contributing)
9. [License](#license)

## Features

- Fetches notices from GGSIPU website
- Broadcasts notices to specified Telegram channels/groups
- Integrates with WhatsApp bot via webhook for wider reach
- Implements security measures for webhook communication

## Prerequisites

- Node.js (v14 or later)
- npm (Node Package Manager)
- Telegram Bot Token (obtain from BotFather)
- GGSIPU notices API endpoint

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/shubhsardana29/ggsipu-notices-telegram-bot.git
   cd ggsipu-notices-telegram-bot
   ```
2. Install dependencies:
  ```
  npm install
  ```
3. Build the project:
   ```
   npm run build
    ```
## Configuration

1. Create a `.env` file in the root directory with the following contents:
   ```
   BOT_TOKEN=your_telegram_bot_token
   CHANNEL_ID=@your_channel_username
   API_ENDPOINT= https://localhost:8000/notices/latest
   WEBHOOK_URL= http://localhost:3000/webhook
   WEBHOOK_SECRET=your_secret_key
   DATABASE_URL="postgresql://username:password@localhost:5432/ggsipu_notices?schema=public"
   ```
2. Adjust the `config.ts` file if needed to customize any additional settings.

## Usage

To start the bot in development mode:
```
npm run dev
```
To start the bot in production mode:
```
npm start
```

## Webhook Integration

This bot integrates with a separate WhatsApp bot for broader dissemination of notices. When new notices are detected, a webhook event is sent to the WhatsApp bot.
[GGSIPU Alert WhatsApp Bot](https://github.com/shubhsardana29/whatsapp-bot-server)

### Security Measures

1. The webhook URL is defined using environment variables to prevent hardcoding.
2. SHA256 encrypted signatures are used to verify the authenticity of webhook calls.
3. The secret key for SHA256 encryption is defined in environment variables on both the Telegram and WhatsApp bot servers.

## Deployment

1. Build the project:
   ```
   npm run build
   ```
2. Deploy the `dist` folder to your hosting service of choice (e.g., Azure , DigitalOcean, AWS).

3. Set up environment variables on your hosting platform.

4. Ensure your bot is running and the webhook to the WhatsApp bot is correctly configured.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.


