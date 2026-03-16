from telegram import Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
import os
import logging

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

BOT_TOKEN = os.environ.get("8331894532:AAEo6tq0grT641NBNVnvMyN3u5zWsJb-lXE")
WEB_APP_URL = os.environ.get("WEB_APP_URL", "https://mayettheanalyst.github.io/epl-predictor")
user_ids = set()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_ids.add(update.effective_user.id)
    keyboard = [[InlineKeyboardButton("🎮 Open Prediction Game", web_app=WebAppInfo(url=WEB_APP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"⚽ Welcome to EPL Predictor, {update.effective_user.first_name}!\n\n"
        "Click the button below to start playing:",
        reply_markup=reply_markup
    )

async def main():
    if not BOT_TOKEN:
        logging.error("BOT_TOKEN not set!")
        return
    
    # Build app with new API
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    
    logging.info("✅ Bot is running...")
    
    # Start polling (new async pattern)
    await application.initialize()
    await application.start()
    await application.updater.start_polling(allowed_updates=Update.ALL_TYPES)
    
    # Keep the bot running
    await application.stop()

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
