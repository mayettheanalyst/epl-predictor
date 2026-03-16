from telegram import Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
import os
import logging

# Set up logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# Get bot token from environment variable (for cloud hosting)
BOT_TOKEN = os.environ.get("8331894532:AAEo6tq0grT641NBNVnvMyN3u5zWsJb-lXE")
WEB_APP_URL = os.environ.get("WEB_APP_URL", "https://mayettheanalyst.github.io/epl-predictor")

# Store user IDs for notifications
user_ids = set()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user_id = update.effective_user.id
    user_ids.add(user_id)
    
    keyboard = [
        [InlineKeyboardButton("🎮 Open Prediction Game", web_app=WebAppInfo(url=WEB_APP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"⚽ Welcome to EPL Predictor, {update.effective_user.first_name}!\n\n"
        "📊 Scoring System:\n"
        "✅ Exact Score: 5 points\n"
        "✅ Correct Winner/Draw: 3 points\n\n"
        "💰 Don't forget to pay the admin to participate!\n\n"
        "Click the button below to start playing:",
        reply_markup=reply_markup
    )

def main():
    """Main function to run the bot"""
    if not BOT_TOKEN:
        print("❌ Error: BOT_TOKEN environment variable not set!")
        return
    
    # Build the application
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    app.add_handler(CommandHandler("start", start))
    
    print("✅ Bot is running...")
    print(f"🌐 Web App URL: {WEB_APP_URL}")
    
    # Run the bot (blocking call)
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
