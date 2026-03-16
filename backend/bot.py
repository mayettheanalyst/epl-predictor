from telegram import Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
import os
import logging

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.DEBUG
)

# Get environment variables
BOT_TOKEN = os.environ.get("BOT_TOKEN")
WEB_APP_URL = os.environ.get("WEB_APP_URL", "https://mayettheanalyst.github.io/epl-predictor")

# Debug: Print what we received (token will be hidden)
print(f"🔍 BOT_TOKEN found: {'YES' if BOT_TOKEN else 'NO'}")
print(f"🔍 BOT_TOKEN length: {len(BOT_TOKEN) if BOT_TOKEN else 0}")
print(f"🔍 WEB_APP_URL: {WEB_APP_URL}")

user_ids = set()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_ids.add(update.effective_user.id)
    keyboard = [[InlineKeyboardButton("🎮 Open Prediction Game", web_app=WebAppInfo(url=WEB_APP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"⚽ Welcome to EPL Predictor!\n\nClick below to play:",
        reply_markup=reply_markup
    )

def main():
    if not BOT_TOKEN:
        print("❌ FATAL: BOT_TOKEN is still not set!")
        print("💡 Check Render Environment tab - variable name must be EXACTLY 'BOT_TOKEN'")
        return
    
    print("✅ BOT_TOKEN is set! Starting bot...")
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    
    print("✅ Bot is running...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
