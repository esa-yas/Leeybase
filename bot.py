import os
import json
import time
import base64
import requests
from dotenv import load_dotenv
import telebot
from telebot.handler_backends import State, StatesGroup
from telebot.storage import StateMemoryStorage

# Load environment variables
load_dotenv()

# Initialize bot with state storage
state_storage = StateMemoryStorage()
bot = telebot.TeleBot(os.getenv('TELEGRAM_BOT_TOKEN'), state_storage=state_storage)

# Gemini API configuration
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GEMINI_TEXT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
GEMINI_VISION_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent"

# Leeybase system prompt
SYSTEM_PROMPT = """You are Leeybase, an AI assistant specifically designed for Ethiopian users. Your responses should be:
1. Culturally aware and respectful of Ethiopian traditions
2. Able to understand and respond to questions about Ethiopian context
3. Helpful in both English and Amharic (when requested)
4. Focused on providing practical solutions for Ethiopian users
5. Knowledgeable about Ethiopian history, culture, and current affairs
6. Professional yet friendly in tone
7. Always truthful and accurate
8. Respectful of Ethiopian values and customs
9. And You are Built by Esayas Desta

When formatting your responses, follow these rules:
1. Use ** for main headings (H1), like: **Main Topic**
2. Use * for subheadings (H2), like: *Subtopic*
3. For lists and sections, use proper markdown:
   - ### for section headers
   - 1. 2. 3. for numbered lists
   - - for bullet points
4. Important terms or concepts should be in **bold**
5. Include relevant Amharic translations in parentheses when appropriate
6. End responses about Ethiopian topics with an Amharic summary in **bold**"""

class UserState(StatesGroup):
    chatting = State()

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def download_telegram_file(file_path):
    """Download a Telegram file and save it locally"""
    file_info = bot.get_file(file_path)
    downloaded_file = bot.download_file(file_info.file_path)
    
    # Create a temporary file path
    local_path = f"temp_{file_path}.jpg"
    with open(local_path, 'wb') as new_file:
        new_file.write(downloaded_file)
    return local_path

def analyze_image(image_path, prompt=""):
    try:
        # Encode image
        base64_image = encode_image(image_path)
        
        headers = {
            'Content-Type': 'application/json',
            'X-goog-api-key': GOOGLE_API_KEY
        }
        
        data = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": SYSTEM_PROMPT + "\n\nAnalyze this image: " + prompt
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": base64_image
                            }
                        }
                    ]
                }
            ]
        }
        
        response = requests.post(GEMINI_VISION_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        
        if 'candidates' in result and len(result['candidates']) > 0:
            content = result['candidates'][0]['content']
            if 'parts' in content and len(content['parts']) > 0:
                return content['parts'][0]['text']
        
        return "Error: Could not analyze the image."
        
    except Exception as e:
        return f"Error analyzing image: {str(e)}"
    finally:
        # Clean up the temporary file
        if os.path.exists(image_path):
            os.remove(image_path)

def get_ai_response(message):
    headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': GOOGLE_API_KEY
    }
    
    data = {
        "contents": [
            {
                "parts": [
                    {
                        "text": SYSTEM_PROMPT
                    },
                    {
                        "text": message
                    }
                ]
            }
        ]
    }
    
    max_retries = 3
    base_delay = 2
    
    for attempt in range(max_retries):
        try:
            print(f"Sending request to Gemini API (attempt {attempt + 1}/{max_retries})")
            response = requests.post(GEMINI_TEXT_URL, headers=headers, json=data)
            
            # Print response for debugging
            print(f"Response status code: {response.status_code}")
            print(f"Response content: {response.text[:500]}...")  # Print first 500 chars of response
            
            response.raise_for_status()
            result = response.json()
            
            # Extract the response text from the correct path in the JSON
            if 'candidates' in result and len(result['candidates']) > 0:
                content = result['candidates'][0]['content']
                if 'parts' in content and len(content['parts']) > 0:
                    return content['parts'][0]['text']
            
            return "Error: Unexpected response format from Gemini API"
            
        except requests.exceptions.RequestException as e:
            print(f"Error on attempt {attempt + 1}: {str(e)}")
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)  # Exponential backoff
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                return f"Error: Unable to get response from Gemini. Details: {str(e)}"
    
    return "Error: Maximum retry attempts reached."

@bot.message_handler(commands=['start'])
def send_welcome(message):
    welcome_text = ("👋 Welcome to LeeybaseAI Bot!\n\n"
                   "ሰላም! እንኳን ደህና መጡ!\n\n"
                   "I'm your Ethiopian AI assistant, designed specifically for Ethiopian users. "
                   "I can help you with various topics and respond in both English and Amharic.\n\n"
                   "You can:\n"
                   "1. Send me text messages for conversation\n"
                   "2. Send me images for analysis\n"
                   "3. Add a description with your image for more specific analysis\n\n"
                   "Just send me your message or image and I'll respond!")
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['help'])
def send_help(message):
    help_text = """
🤖 **LeeybaseAI Bot Help** (የእገዛ መመሪያ)

Here are the available commands:
• /start - Start the bot and begin chatting
• /help - Show this help message

Features:
1. Bilingual Support (ባለ ሁለት ቋንቋ ድጋፍ)
   - English and Amharic responses
   - Cultural context awareness
   
2. Ethiopian Focus (የኢትዮጵያ ትኩረት)
   - Local knowledge and context
   - Cultural sensitivity
   - Current affairs understanding

3. Image Analysis (የሥዕል ትንተና)
   - Send any image for analysis
   - Add a description with your image
   - Get detailed insights about the image

4. Formatting
   - Markdown support
   - Clear section organization
   - Amharic translations when needed

Send any message or image to start!
ለመጀመር ማንኛውንም መልእክት ወይም ምስል ይላኩ!
    """
    bot.reply_to(message, help_text, parse_mode='Markdown')

@bot.message_handler(content_types=['photo'])
def handle_image(message):
    try:
        # Show typing indicator
        bot.send_chat_action(message.chat.id, 'typing')
        
        # Get the largest photo (best quality)
        photo = message.photo[-1]
        
        # Download the image
        local_path = download_telegram_file(photo.file_id)
        
        # Get caption if exists, or use empty string
        prompt = message.caption if message.caption else ""
        
        # Analyze the image
        response = analyze_image(local_path, prompt)
        
        # Split long messages if needed (Telegram has a 4096 character limit)
        if len(response) > 4000:
            for i in range(0, len(response), 4000):
                bot.reply_to(message, response[i:i+4000])
        else:
            bot.reply_to(message, response)
            
    except Exception as e:
        error_message = f"Sorry, an error occurred while processing the image: {str(e)}"
        print(error_message)
        bot.reply_to(message, error_message)

@bot.message_handler(func=lambda message: True)
def handle_all_messages(message):
    # Ignore command messages
    if message.text.startswith('/'):
        return
        
    # Show typing indicator
    bot.send_chat_action(message.chat.id, 'typing')
    
    try:
        # Get AI response
        response = get_ai_response(message.text)
        
        # Split long messages if needed (Telegram has a 4096 character limit)
        if len(response) > 4000:
            for i in range(0, len(response), 4000):
                bot.reply_to(message, response[i:i+4000])
        else:
            bot.reply_to(message, response)
            
    except Exception as e:
        error_message = f"Sorry, an error occurred: {str(e)}"
        print(error_message)
        bot.reply_to(message, error_message)

if __name__ == '__main__':
    print("Bot started...")
    print("Using Leeybase AI with Gemini API (Text + Vision)")
    bot.infinity_polling() 