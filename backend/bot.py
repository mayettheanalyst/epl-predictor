import os
import logging

# ===== SUPER DEBUG: Print ALL environment variables =====
print("\n" + "🔍"*30)
print("🔍 ALL ENVIRONMENT VARIABLES RECEIVED BY RENDER:")
print("-"*60)
for key, value in sorted(os.environ.items()):
    if 'TOKEN' in key.upper() or 'URL' in key.upper() or 'WEB' in key.upper():
        # Show variables related to our app
        print(f"   {key} = {value[:20]}{'...' if len(value) > 20 else ''}")
print("-"*60)
print(f"🔍 Total env vars: {len(os.environ)}")
print("🔍"*30 + "\n")

# ===== Now try to get our specific variables =====
TOKEN = os.getenv("BOT_TOKEN")
WEB_APP = os.getenv("WEB_APP_URL", "https://mayettheanalyst.github.io/epl-predictor")

print(f"✅ os.getenv('BOT_TOKEN'): {'✅ FOUND' if TOKEN else '❌ NOT FOUND'}")
print(f"✅ os.getenv('WEB_APP_URL'): {WEB_APP}")

# If still not found, try common variations
for variant in ['bot_token', 'Bot_Token', 'botToken', 'TELEGRAM_BOT_TOKEN']:
    val = os.getenv(variant)
    if val:
        print(f"⚠️ Found token under different key: '{variant}'")

if not TOKEN:
    print("\n❌ CRITICAL: BOT_TOKEN not found in environment!")
    print("💡 Possible causes:")
    print("   1. Variable name is case-sensitive (must be BOT_TOKEN)")
    print("   2. Variable was added but Render hasn't redeployed yet")
    print("   3. Variable has hidden characters (spaces, quotes)")
    print("   4. Render build cache is stale")
    exit(1)  # Exit so we don't crash with confusing errors

# ===== Rest of bot code (won't run if token not found) =====
from telegram import Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    keyboard = [[InlineKeyboardButton("🎮 Play Now", web_app=WebAppInfo(url=WEB_APP))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(f"⚽ Hi {user.first_name}! Click below to play:", reply_markup=reply_markup)

def main():
    logger.info("✅ Building Telegram application...")
    application = Application.builder().token(TOKEN).build()
    application.add_handler(CommandHandler("start", start_command))
    logger.info("🚀 Starting bot...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
