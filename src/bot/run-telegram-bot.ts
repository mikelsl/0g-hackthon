import 'dotenv/config';
import { TelegramWerewolfBot } from './TelegramWerewolfBot.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');

const bot = new TelegramWerewolfBot(token);
await bot.launch();

const shutdown = (signal: string) => {
  try {
    bot.stop(signal);
  } finally {
    process.exit(0);
  }
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
