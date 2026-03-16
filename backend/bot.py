import os
import logging
from telegram import Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

# ===== CONFIGURATION =====
# Get token from environment (Render) or use fallback for testing
TOKEN = os.getenv("8331894532:AAEo6tq0grT641NBNVnvMyN3u5zWsJb-lXE")
WEB_APP = os.getenv("WEB_APP_URL", "https://mayettheanalyst.github.io/epl-predictor")

# ===== LOGGING SETUP =====
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===== BOT COMMANDS =====
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    logger.info(f"User {user.id} started the bot")
    
    # Create keyboard with Web App button
    keyboard = [[
        InlineKeyboardButton("🎮 Play Now", web_app=WebAppInfo(url=WEB_APP))
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Send welcome message
    await update.message.reply_text(
        f"⚽ Hi {user.first_name}! Welcome to EPL Predictor!\n\n"
        "Predict scores, compete with friends, win points!\n\n"
        "👇 Click below to start:",
        reply_markup=reply_markup
    )

# ===== MAIN FUNCTION =====
def main():
    """Start the bot"""
    
    # 🔍 DEBUG: Print what we have
    print("\n" + "="*50)
    print("🔍 BOT STARTING - DEBUG INFO:")
    print(f"   TOKEN from env: {'✅ SET' if TOKEN else '❌ NOT SET'}")
    print(f"   TOKEN length: {len(TOKEN) if TOKEN else 0}")
    print(f"   WEB_APP_URL: {WEB_APP}")
    print("="*50 + "\n")
    
    # ❌ Stop if no token
    if not TOKEN:
        logger.error("🚨 FATAL: BOT_TOKEN is NOT set!")
        logger.error("💡 Fix: Add 'BOT_TOKEN' to Render Environment Variables")
        print("\n❌ Bot cannot start without BOT_TOKEN")
        return  # Exit gracefully instead of crashing
    
    # ✅ Create the application
    logger.info("✅ Building Telegram application...")
    application = Application.builder().token(TOKEN).build()
    
    # ✅ Add command handlers
    application.add_handler(CommandHandler("start", start_command))
    logger.info("✅ Handlers added")
    
    # ✅ Start the bot
    logger.info("🚀 Starting bot polling...")
    print("\n✅✅✅ BOT IS NOW RUNNING! ✅✅✅\n")
    
    # Run polling (this blocks and keeps bot alive)
    application.run_polling(allowed_updates=Update.ALL_TYPES)

# ===== ENTRY POINT =====
if __name__ == "__main__":
    main()
