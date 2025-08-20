# ElevenLabs Conversational AI with React Native (Expo SDK 53)

## Overview
ElevenLabs Conversational AI works with React Native using **Expo SDK 53**, and **requires development builds (EAS / Dev Client)** due to its reliance on native WebRTC modules. Expo Go is **not compatible**.  
Sources: [ElevenLabs RN SDK] and [ElevenLabs Expo Cookbook]

---

## 1. React Native SDK Setup

### Installation

```bash
npm install @elevenlabs/react-native @livekit/react-native @livekit/react-native-webrtc livekit-client

Requirements
	•	Must use Expo Dev Builds (EAS / Dev Client) — Expo Go won’t work.
	•	Must configure microphone permissions for both iOS and Android.

Provider Setup

import { ElevenLabsProvider } from '@elevenlabs/react-native';

function App() {
  return (
    <ElevenLabsProvider>
      <YourAppComponents />
    </ElevenLabsProvider>
  );
}

useConversation Hook Usage

import { useConversation } from '@elevenlabs/react-native';

function ConversationComponent() {
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (event) => console.log('Message:', event),
    onError: (err) => console.error('Error:', err),
    onModeChange: (mode) => console.log('Mode changed:', mode),
    onStatusChange: (status) => console.log('Status:', status),
    onCanSendFeedbackChange: (prop) =>
      console.log('Can send feedback:', prop.canSendFeedback),
  });

  // Methods available: startSession, endSession, sendUserMessage, sendFeedback
}


⸻

2. Expo Cookbook: Cross-Platform Voice Agents

A full walkthrough for building voice agents with Expo + ElevenLabs for iOS and Android.
Source: [Expo Cookbook]

Key Steps:
	1.	Initialize Expo project

npx create-expo-app@latest --template blank-typescript


	2.	Install Expo-compatible dependencies

npx expo install \
  @elevenlabs/react-native @livekit/react-native @livekit/react-native-webrtc \
  @config-plugins/react-native-webrtc @livekit/react-native-expo-plugin livekit-client


	3.	Configure app.json

{
  "expo": {
    "scheme": "elevenlabs",
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "This app uses the microphone to record audio."
      },
      "supportsTablet": true,
      "bundleIdentifier": "YOUR.BUNDLE.ID"
    },
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.CAMERA",
        "android.permission.INTERNET",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.WAKE_LOCK",
        "android.permission.BLUETOOTH"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "YOUR.PACKAGE.ID"
    },
    "plugins": [
      "@livekit/react-native-expo-plugin",
      "@config-plugins/react-native-webrtc"
    ]
  }
}


	4.	Implement in App.tsx
Use ElevenLabsProvider, useConversation() and build UI: start/end session buttons, status display, feedback controls, messaging inputs, etc.

⸻

3. Additional References

Topic	Description
Expo blog - voice agents with Expo & ElevenLabs	Alternative approach using Expo webview and React SDK
Community sample repo	Example app using ElevenLabs + Expo
Why Expo Dev Builds matter	Only Dev Builds include native modules like WebRTC


⸻

Summary Table

Step	Action
1⃣	Install ElevenLabs + LiveKit dependencies
2⃣	Use Expo Dev Builds (not Expo Go)
3⃣	Configure app.json with required permissions and plugins
4⃣	Wrap app in ElevenLabsProvider and use useConversation()
5⃣	Reference Expo Cookbook for full setup and guidance


⸻
## References

Official Documentation Links
	•	ElevenLabs React Native SDK (with Expo support, WebRTC)
https://elevenlabs.io/docs/conversational-ai/libraries/react-native  ￼ ￼
	•	Expo Cookbook — Cross‑platform Voice Agents with Expo React Native
https://elevenlabs.io/docs/cookbooks/conversational-ai/expo-react-native  ￼
	•	ElevenLabs React SDK (Web/React version)
https://elevenlabs.io/docs/conversational-ai/libraries/react  ￼
	•	Quickstart for Conversational AI integration
https://elevenlabs.io/docs/cookbooks/conversational-ai/quickstart  ￼
	•	Expo Blog: How to build universal voice agents with Expo & ElevenLabs
https://expo.dev/blog/how-to-build-universal-app-voice-agents-with-expo-and-elevenlabs  ￼
	•	GitHub Example — cabrila/ElevenLabsReactNative
https://github.com/cabrila/ElevenLabsReactNative  ￼

