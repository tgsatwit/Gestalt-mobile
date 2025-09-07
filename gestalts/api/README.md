# API Deployment for Voice Transcription

This API folder contains serverless functions for handling sensitive operations that require API keys not exposed to the client.

## Setup

### For Local Development

1. Create a `.env.local` file in the `api` directory:
```
OPENAI_API_KEY=your_actual_openai_api_key_here
```

2. Run a local server (e.g., using Vercel CLI):
```bash
npm i -g vercel
vercel dev
```

3. Update the `EXPO_PUBLIC_API_URL` in your `.env` file to point to your local server:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### For Production Deployment (Vercel)

1. Deploy to Vercel:
```bash
vercel --prod
```

2. Add your OpenAI API key as an environment variable in Vercel:
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add `OPENAI_API_KEY` with your actual key

3. Update `EXPO_PUBLIC_API_URL` in your production environment to your Vercel URL:
```
EXPO_PUBLIC_API_URL=https://your-app.vercel.app
```

### For Other Deployment Platforms

The API endpoint can be deployed to any platform that supports Node.js serverless functions:
- Netlify Functions
- AWS Lambda
- Google Cloud Functions
- Azure Functions

Just ensure:
1. The `OPENAI_API_KEY` environment variable is set on the server
2. The `EXPO_PUBLIC_API_URL` points to your deployed API endpoint
3. CORS headers are properly configured (already included in the code)

## API Endpoints

### POST /api/transcribe
Transcribes audio using OpenAI's Whisper API.

**Request:**
- Method: POST
- Body: FormData with:
  - `audio`: Audio file (blob)
  - `language`: Language code (optional, defaults to 'en')

**Response:**
```json
{
  "text": "Transcribed text here"
}
```

## Security Notes

- The OpenAI API key is NEVER exposed to the client
- All transcription requests go through this server-side endpoint
- The server validates requests and handles errors appropriately
- CORS is configured to allow requests from your app