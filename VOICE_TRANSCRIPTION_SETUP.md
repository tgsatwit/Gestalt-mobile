# Voice Transcription Setup Guide

The voice transcription feature has been updated to use a secure server-side API to protect your OpenAI API key.

## What Changed

Previously, the app tried to use the OpenAI API directly from the client, which would expose your API key. Now:
- The OpenAI API key stays secure on your server
- The app sends audio to your server endpoint
- Your server handles the transcription and returns the text

## Quick Setup

### Option 1: Local Development (Recommended for Testing)

1. **Navigate to the API folder:**
   ```bash
   cd gestalts/api
   ```

2. **Create a `.env` file with your OpenAI API key:**
   ```bash
   echo "OPENAI_API_KEY=your_actual_openai_api_key_here" > .env
   ```

3. **Start the API server:**
   ```bash
   npm start
   ```
   The server will run on http://localhost:3000

4. **Update your app's environment:**
   Create or update `gestalts/.env` with:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

5. **Restart your Expo development server**

### Option 2: Deploy to Vercel (For Production)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from the API folder:**
   ```bash
   cd gestalts/api
   vercel --prod
   ```

3. **Add your OpenAI API key in Vercel Dashboard:**
   - Go to your project settings on vercel.com
   - Add environment variable: `OPENAI_API_KEY`

4. **Update your app's environment:**
   ```
   EXPO_PUBLIC_API_URL=https://your-deployment.vercel.app
   ```

### Option 3: Deploy to Other Platforms

The API can be deployed to:
- Netlify Functions
- AWS Lambda
- Google Cloud Functions
- Any Node.js hosting

Just ensure the `OPENAI_API_KEY` environment variable is set on your server.

## Testing

1. Open your app in the iOS simulator
2. Navigate to a screen with voice input (like Add Journal)
3. Tap the microphone button
4. Grant microphone permissions if prompted
5. Speak your message
6. Tap the stop button
7. Your speech should be transcribed and appear in the text field

## Troubleshooting

### Error: "Failed to transcribe audio"
- Check that your API server is running
- Verify your OpenAI API key is correct
- Ensure EXPO_PUBLIC_API_URL points to your server

### Error: "Network request failed"
- For iOS simulator with localhost, you may need to use your computer's IP address instead of localhost
- Find your IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Update EXPO_PUBLIC_API_URL to use your IP: `http://YOUR_IP:3000`

### No transcription appears
- Check the console logs in both the app and API server
- Verify the audio is being recorded properly
- Ensure your OpenAI account has credits/is active

## Security Notes

- **Never commit your `.env` file with the actual API key**
- The `.gitignore` is already configured to exclude it
- Always use server-side endpoints for sensitive API operations
- The OPENAI_API_KEY should never have the `EXPO_PUBLIC_` prefix

## File Structure

```
gestalts/
├── api/                          # Server-side API
│   ├── transcribe.ts            # Vercel serverless function
│   ├── server.js                # Express server for local dev
│   ├── package.json             # API dependencies
│   ├── .env.example             # Environment template
│   └── README.md                # API documentation
├── src/
│   ├── components/
│   │   └── VoiceTranscriptionInput.tsx  # Updated component
│   └── services/
│       └── transcriptionService.ts      # API client
└── .env.example                 # App environment template
```

## Next Steps

1. Get your OpenAI API key from https://platform.openai.com/api-keys
2. Choose your deployment option (local or production)
3. Follow the setup steps above
4. Test the voice transcription feature

The app is now ready to use voice transcription securely without exposing your API key!