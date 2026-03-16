from telegram import Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
import os
import asyncio

# Your bot token from @BotFather
BOT_TOKEN = "8331894532:AAEo6tq0grT641NBNVnvMyN3u5zWsJb-lXE"

# Your web app URL (GitHub Pages URL)
WEB_APP_URL = "https://mayettheanalyst.github.io/epl-predictor"

# Store user IDs for notifications
user_ids = set()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Save user ID for notifications
    user_ids.add(update.effective_user.id)
    
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

async def notify_new_gameweek(context: ContextTypes.DEFAULT_TYPE):
    """Send notification to all users about new gameweek"""
    gameweek = context.job.data.get('gameweek', 1)
    
    keyboard = [
        [InlineKeyboardButton("🎮 Make Predictions", web_app=WebAppInfo(url=WEB_APP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    for user_id in user_ids:
        try:
            await context.bot.send_message(
                chat_id=user_id,
                text=f"⚽ New Gameweek {gameweek} is here!\n\n"
                     "Make your predictions before the matches start!\n\n"
                     "💰 Remember to pay the admin if you haven't yet!",
                reply_markup=reply_markup
            )
        except Exception as e:
            print(f"Error notifying user {user_id}: {e}")

async def notify_matches_starting(context: ContextTypes.DEFAULT_TYPE):
    """Remind users to submit predictions before matches start"""
    keyboard = [
        [InlineKeyboardButton("🎮 Submit Now", web_app=WebAppInfo(url=WEB_APP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    for user_id in user_ids:
        try:
            await context.bot.send_message(
                chat_id=user_id,
                text="⏰ Reminder: Matches are starting soon!\n\n"
                     "Submit your predictions before kickoff!",
                reply_markup=reply_markup
            )
        except Exception as e:
            print(f"Error notifying user {user_id}: {e}")

async def main():
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    
    # Schedule notifications (examples)
    # app.job_queue.run_daily(notify_matches_starting, time=datetime.time(hour=10, minute=0))
    
    print("✅ Bot is running...")
    await app.run_polling()

if __name__ == '__main__':
    asyncio.run(main())
