import 'dotenv/config';
import { TelegramWerewolfBot } from './TelegramWerewolfBot.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');

const bot = new TelegramWerewolfBot(token);
await bot.launch();

process.once('SIGINT', () => process.exit(0));
process.once('SIGTERM', () => process.exit(0));
