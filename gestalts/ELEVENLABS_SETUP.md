# ElevenLabs AI Coach Setup Guide

This guide will help you set up the ElevenLabs Conversational AI integration for the Gestalts Coach feature.

## Prerequisites

1. **ElevenLabs Account**: Sign up at [elevenlabs.io](https://elevenlabs.io)
2. **API Key**: Get your API key from the ElevenLabs dashboard
3. **Conversational AI Access**: Ensure you have access to ElevenLabs Conversational AI features

## Setup Steps

### 1. Create AI Agents

In your ElevenLabs dashboard, create three conversational AI agents:

**Language Coach Agent:**
- **Name**: Language Coach
- **System Prompt**: Use the prompt from `src/services/elevenLabsService.ts` under `AGENT_CONFIGS['Language Coach'].systemPrompt`
- **Model**: Claude 3.5 Sonnet (recommended)
- **Voice**: Choose a warm, professional voice

**Parent Support Agent:**
- **Name**: Parent Support 
- **System Prompt**: Use the prompt from `src/services/elevenLabsService.ts` under `AGENT_CONFIGS['Parent Support'].systemPrompt`
- **Model**: Claude 3.5 Sonnet (recommended)
- **Voice**: Choose a gentle, empathetic voice

**Child Mode Agent:**
- **Name**: Child Mode
- **System Prompt**: Use the prompt from `src/services/elevenLabsService.ts` under `AGENT_CONFIGS['Child Mode'].systemPrompt`
- **Model**: Claude 3.5 Sonnet (recommended)
- **Voice**: Choose a friendly, child-appropriate voice

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your actual values:
   ```env
   # ElevenLabs Configuration
   ELEVENLABS_API_KEY=sk_your_actual_api_key_here
   
   # Agent IDs (from your ElevenLabs dashboard)
   # Note: Voice selection is configured in each agent's settings in ElevenLabs
   LANGUAGE_COACH_AGENT_ID=va8wh90V9tqH3TSuqEky
   PARENT_SUPPORT_AGENT_ID=Vh2JDkXXbSsD2sFbm9XG
   CHILD_MODE_AGENT_ID=O9hZSxrfAjdWixrZTfk3
   ```

3. **Important**: Restart your development server after updating `.env`:
   ```bash
   npm start
   ```

### 3. Environment Variables Are Automatically Loaded

The app is now configured to automatically load environment variables from your `.env` file:

- ✅ **Automatic Detection**: The app automatically detects if you're using real API keys
- ✅ **Demo Mode**: Shows "Demo Mode" when using placeholder keys
- ✅ **Live Mode**: Shows "Live AI - ElevenLabs Connected" when using real keys
- ✅ **No Code Changes Required**: All configuration is handled through environment variables

### 4. Audio Permissions

The app requires microphone permissions for voice functionality. These are handled automatically, but ensure your app has the proper permissions in `app.json` or `Info.plist`.

## Features

### Voice-to-Voice Mode
- Tap the microphone icon in the header to switch to voice mode
- Tap and hold the large microphone button to record
- Audio is automatically transcribed and sent to the AI
- AI responses are played back as audio

### Text-to-Text Mode  
- Default mode with text input
- Type messages and send with the send button
- See streaming responses in real-time
- Full conversation history

### Agent Switching
- Use the mode pills at the top to switch between:
  - **Language Coach**: GLP expertise and strategies
  - **Parent Support**: Emotional support and encouragement
  - **Child Mode**: Direct child engagement

### Streaming Chat
- Real-time streaming responses
- Visual typing indicators
- Message timestamps
- Voice message indicators

## Troubleshooting

### Connection Issues
- Verify your API key is correct
- Check your internet connection
- Ensure agent IDs are valid

### Audio Issues
- Check microphone permissions
- Ensure device volume is up
- Try switching between voice and text modes

### Agent Not Responding
- Verify the agent ID matches your ElevenLabs dashboard
- Check the system prompts are properly configured
- Ensure you have sufficient API credits

## API Rate Limits & Costs

- **Free Tier**: 15 minutes of conversation time
- **Paid Tiers**: Higher limits and concurrent conversations
- **Pricing**: ~$0.08/minute for conversations
- **Silent Periods**: Reduced pricing during pauses (5% of normal rate)

## Next Steps

1. Test each agent mode thoroughly
2. Customize system prompts based on your specific needs
3. Choose appropriate voices for each mode
4. Monitor usage and costs in the ElevenLabs dashboard

For more details, see the [ElevenLabs Conversational AI documentation](https://elevenlabs.io/docs/conversational-ai/overview).