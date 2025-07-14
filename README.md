# LeeyBase AI Platform 🇪🇹

A comprehensive AI platform designed specifically for Ethiopian users, featuring both a web application and a Telegram bot. The platform leverages Google's Gemini AI to provide intelligent services with cultural context and local language support, backed by Supabase for robust data management and authentication.

## Platform Components 🌐

### 1. LeeyBase AI Web App
- Modern, responsive web interface built with Next.js
- Real-time AI conversations with Gemini Pro
- Document analysis and processing
- Secure user authentication via Supabase
- Chat history and message management
- Profile customization
- Message reactions and code highlighting
- Progress tracking and history

### 2. Telegram Bot
- Bilingual support (English and Amharic)
- Smart conversations with Ethiopian cultural context
- Image analysis capabilities
- Markdown formatting support
- Rate limiting and error handling
- Ethiopian-focused responses

### 3. Backend Infrastructure
- Supabase Database Integration
  - User profiles and authentication
  - Chat history management
  - Message storage and retrieval
  - Row Level Security (RLS)
- Google Gemini AI Integration
  - Text generation and analysis
  - Image processing capabilities
  - Context-aware responses

## Database Schema 🗄️

### Tables
1. **profiles**
   - User profile management
   - Linked to Supabase authentication
   - Stores username, full name, and avatar

2. **chats**
   - Conversation management
   - User-specific chat sessions
   - Timestamp tracking

3. **messages**
   - Message storage
   - Support for user and assistant roles
   - Code snippet handling
   - Reaction system

## Prerequisites 📋

### For Web App
- Node.js 18 or higher
- npm or yarn package manager
- Supabase account and project
- Google AI API key
- Modern web browser
- Internet connection

### For Telegram Bot
- Python 3.8 or higher
- A Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Google AI API Key (for Gemini)
- pip (Python package installer)

## Installation 🛠️

### Database Setup
1. Create a new Supabase project
2. Execute the following SQL in Supabase SQL editor:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table with profiles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- Create chats table
CREATE TABLE public.chats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    is_code BOOLEAN DEFAULT false,
    language TEXT,
    reactions JSONB DEFAULT '{"thumbs_up": 0, "thumbs_down": 0}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can view own chats" 
    ON public.chats FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create chats" 
    ON public.chats FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" 
    ON public.chats FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their chats" 
    ON public.messages FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.chats WHERE id = messages.chat_id
        )
    );

CREATE POLICY "Users can create messages" 
    ON public.messages FOR INSERT 
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.chats WHERE id = chat_id
        )
    );

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. Verify that all tables, policies, and triggers are created successfully

### Web App Setup
1. Clone this repository:
```bash
git clone https://github.com/yourusername/leeybase-ai.git
cd leeybase-ai
```

2. Install web app dependencies:
```bash
npm install
```

3. Create a `.env` file and add required environment variables:
```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google API Configuration
GOOGLE_API_KEY=your_google_api_key

# Telegram Bot Configuration (if using bot component)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

⚠️ SECURITY NOTE:
- Never commit your `.env` file to version control
- Add `.env` to your `.gitignore` file
- Regularly rotate your API keys and tokens
- Use different API keys for development and production
- Keep your API keys private and secure

4. Start the web app:
```bash
npm run dev
```

### Telegram Bot Setup
1. Navigate to the bot directory:
```bash
cd telegram-bot
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Configure bot environment:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GOOGLE_API_KEY=your_google_api_key
```

4. Start the bot:
```bash
python bot.py
```

## Usage 💡

### Web App
1. Visit the web application URL
2. Create an account or log in through Supabase authentication
3. Start interacting with the AI
4. Upload documents or images for analysis
5. Track your conversation history
6. React to messages and manage your chats

### Telegram Bot
1. Start a conversation with the bot on Telegram
2. Use available commands:
   - `/start` - Start the bot and get a welcome message
   - `/help` - Show available commands and usage instructions
   - Send any text message to get a response
   - Send an image with optional caption for analysis

## Amharic Instructions (የአማርኛ መመሪያ) 🇪🇹

### መግቢያ
ሊይቤዝ ኤአይ በሁለት መንገዶች ለመጠቀም የሚያስችል ፕላትፎርም ነው:
1. የድር መተግበሪያ (Web App)
2. የቴሌግራም ቦት

### የድር መተግበሪያ አጠቃቀም
1. ወደ ድር መተግበሪያው ይግቡ
2. አካውንት ይፍጠሩ ወይም ይግቡ
3. ከኤአይ ጋር ይወያዩ
4. ሰነዶችን እና ምስሎችን ያስተላልፉ
5. የመልእክት ታሪክዎን ይከታተሉ

### የቴሌግራም ቦት አጠቃቀም
1. ቦቱን በቴሌግራም ላይ ያግኙት
2. `/start` ለመጀመር ይጠቀሙ
3. `/help` ለእገዛ መመሪያ
4. ማንኛውንም መልእክት ይላኩ
5. ምስል ከመግለጫ ጋር ወይም ያለመግለጫ መላክ ይችላሉ

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Google Gemini AI
- Supabase Platform
- Next.js Framework
- Python Telegram Bot community
- All contributors and users

---
Made with ❤️ for Ethiopia 🇪🇹 
