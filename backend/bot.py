import os
import sys
import asyncio
import logging
from telegram import Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

# ===== CONFIGURATION =====
TOKEN = os.getenv("BOT_TOKEN")
WEB_APP = os.getenv("WEB_APP_URL", "https://mayettheanalyst.github.io/epl-predictor")

# ===== LOGGING =====
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout  # Important for Render logs
)
logger = logging.getLogger(__name__)

# ===== BOT COMMANDS =====
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    logger.info(f"User {user.id} started the bot")
    
    keyboard = [[
        InlineKeyboardButton("🎮 Play Now", web_app=WebAppInfo(url=WEB_APP))
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"⚽ Hi {user.first_name}! Welcome to EPL Predictor!\n\n"
        "👇 Click below to start:",
        reply_markup=reply_markup
    )

# ===== MAIN ASYNC FUNCTION =====
async def run_bot():
    """Main async function to run the bot"""
    
    if not TOKEN:
        logger.error("❌ BOT_TOKEN not found!")
        return
    
    logger.info("✅ Building Telegram application...")
    
    # Build application
    application = Application.builder().token(TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start_command))
    
    logger.info("✅ Handlers added")
    logger.info("🚀 Starting bot...")
    
    # Initialize and start
    await application.initialize()
    await application.start()
    
    # Start polling (this runs in background)
    await application.updater.start_polling(allowed_updates=Update.ALL_TYPES)
    
    logger.info("✅✅✅ BOT IS NOW RUNNING! ✅✅✅")
    
    # Keep the bot alive by running forever
    # This is the key fix for Python 3.14
    try:
        while True:
            await asyncio.sleep(3600)  # Sleep 1 hour, repeat forever
    except asyncio.CancelledError:
        logger.info("Bot shutdown requested")
    finally:
        await application.stop()
        await application.shutdown()

# ===== ENTRY POINT =====
def main():
    """Entry point - runs the async bot"""
    print("\n" + "="*50)
    print("🔍 BOT STARTING:")
    print(f"   TOKEN: {'✅' if TOKEN else '❌'}")
    print(f"   WEB_APP: {WEB_APP}")
    print("="*50 + "\n")
    
    # Run the async function properly
    asyncio.run(run_bot())

if __name__ == "__main__":
    main()
