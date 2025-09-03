require('dotenv/config');

export default ({config}) => ({
  "expo": {
    "name": "Gestalts",
    "slug": "gestalts",
    "owner": "tgsatwit",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "extra": {
      "elevenLabsApiKey": process.env.ELEVENLABS_API_KEY,
      "languageCoachAgentId": process.env.LANGUAGE_COACH_AGENT_ID,
      "parentSupportAgentId": process.env.PARENT_SUPPORT_AGENT_ID,
      "childModeAgentId": process.env.CHILD_MODE_AGENT_ID,
      "geminiApiKey": process.env.GEMINI_API_KEY,
      "eas": {
        "projectId": "d01362c3-ba19-4747-9150-6c91b96fea0f"
      },
      "firebase": {
        "apiKey": process.env.FIREBASE_API_KEY,
        "authDomain": process.env.FIREBASE_AUTH_DOMAIN,
        "projectId": process.env.FIREBASE_PROJECT_ID,
        "storageBucket": process.env.FIREBASE_STORAGE_BUCKET,
        "messagingSenderId": process.env.FIREBASE_MESSAGING_SENDER_ID,
        "appId": process.env.FIREBASE_APP_ID
      }
    },
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.tgsatwit.gestalts",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "This app uses the microphone to record audio for AI voice interactions."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.tgsatwit.gestalts",
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.CAMERA",
        "android.permission.INTERNET",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.WAKE_LOCK",
        "android.permission.BLUETOOTH"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-apple-authentication",
      "@livekit/react-native-expo-plugin"
    ]
  }
});