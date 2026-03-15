import dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('✅ Environment loaded');
  console.log('Gemini Key exists:', !!process.env.GEMINI_API_KEY);
  console.log('Telegram Token exists:', !!process.env.TELEGRAM_BOT_TOKEN);
  console.log('Sheet ID exists:', !!process.env.GOOGLE_SHEET_ID);
  console.log('Credentials path:', process.env.GOOGLE_CREDENTIALS_PATH);
}

test();