<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1-uNHSkwN-GzthmSlwPZExEblV0FpUSJ-

## About MockupSuite

MockupSuite is an AI-powered mockup generator that creates professional product photography and mockups using Google's Gemini AI.

## Run Locally

**Prerequisites:** Node.js and Docker Desktop

### Option 1: Using Docker (Recommended)

1. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your actual API keys and Supabase credentials.

2. **Start the development server:**
   ```bash
   docker-compose up mockupsuite
   ```
   
   Your app will be available at http://localhost:3000

3. **For production build:**
   ```bash
   docker-compose --profile production up mockupsuite-prod
   ```
   
   Your app will be available at http://localhost:80

### Option 2: Manual Setup

1. Install dependencies:
   `npm install`
2. Set the environment variables:
   - Copy `.env.example` to `.env` and fill in your values
   - Set the `GEMINI_API_KEY` to your Gemini API key
   - Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your Supabase credentials
3. Run the app:
   `npm run dev`
