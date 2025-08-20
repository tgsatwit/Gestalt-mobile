// ElevenLabs Conversational AI Service
import { Audio } from 'expo-audio';
import Constants from 'expo-constants';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  audioUrl?: string;
}

export interface AgentConfig {
  agentId: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: 'claude-3-5-sonnet' | 'gpt-4o' | 'gemini-pro';
}

// Get environment variables from expo-constants
const getEnvVar = (key: string, fallback: string = '') => {
  const extra = Constants.expoConfig?.extra || {};
  
  const envMap: Record<string, string> = {
    'ELEVENLABS_API_KEY': extra.elevenLabsApiKey || 'your-api-key-here',
    'LANGUAGE_COACH_AGENT_ID': extra.languageCoachAgentId || 'lang-coach-agent-id',
    'PARENT_SUPPORT_AGENT_ID': extra.parentSupportAgentId || 'parent-support-agent-id', 
    'CHILD_MODE_AGENT_ID': extra.childModeAgentId || 'child-mode-agent-id'
  };
  
  return envMap[key] || fallback;
};

// Agent configurations for different modes
export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'Language Coach': {
    agentId: getEnvVar('LANGUAGE_COACH_AGENT_ID'),
    name: 'Language Coach',
    description: 'Expert in Gestalt Language Processing and speech development',
    model: 'claude-3-5-sonnet',
    systemPrompt: `You are a compassionate and knowledgeable Gestalt Language Processing (GLP) specialist. 

Your role is to:
- Provide evidence-based guidance on GLP strategies and language development
- Help parents understand their child's communication patterns and progress
- Suggest practical daily activities that support language growth
- Explain GLP stages and progression in accessible terms
- Offer encouragement and celebrate small wins

Keep responses warm, practical, and focused on actionable advice. Always consider the emotional journey parents are on.`
  },
  'Parent Support': {
    agentId: getEnvVar('PARENT_SUPPORT_AGENT_ID'),
    name: 'Parent Support',
    description: 'Emotional support and guidance for parents',
    model: 'claude-3-5-sonnet',
    systemPrompt: `You are a warm, empathetic support companion for parents of children with communication differences.

Your role is to:
- Listen without judgment and validate feelings
- Provide emotional support during challenging moments
- Help parents process their experiences and emotions
- Offer gentle guidance for self-care and stress management
- Remind parents they're not alone in this journey

Use a gentle, understanding tone. Focus on emotional validation before offering suggestions. Be a trusted friend who truly gets it.`
  },
  'Child Mode': {
    agentId: getEnvVar('CHILD_MODE_AGENT_ID'),
    name: 'Child Mode',
    description: 'Interactive engagement designed for direct child interaction',
    model: 'claude-3-5-sonnet',
    systemPrompt: `You are a playful, patient companion designed to engage directly with children who are gestalt language processors.

Your role is to:
- Use simple, clear language appropriate for the child's level
- Be patient with echolalia and gestalt language patterns
- Turn interactions into fun, language-rich experiences
- Follow the child's lead and interests
- Celebrate all communication attempts

Keep language simple, positive, and engaging. Use playful tone and be genuinely excited about the child's participation.`
  }
};

export interface ElevenLabsConfig {
  apiKey: string;
  agentId: string;
}

export class ElevenLabsConversationalAI {
  private config: ElevenLabsConfig;
  private websocket: WebSocket | null = null;
  private currentConversation: ConversationMessage[] = [];
  private onMessageCallback?: (message: ConversationMessage) => void;
  private onStreamingCallback?: (content: string, isComplete: boolean) => void;
  private audioRecording?: Audio.AudioRecording;
  private soundObject?: Audio.AudioPlayer;

  constructor(config: ElevenLabsConfig) {
    this.config = config;
  }

  // Initialize connection to ElevenLabs
  async initializeConnection(): Promise<void> {
    // Check if we're in development mode with placeholder values
    if (this.config.apiKey === 'your-api-key-here' || this.config.agentId.includes('agent-id')) {
      console.warn('ElevenLabs: Using placeholder credentials - entering demo mode');
      // Simulate successful connection for development
      setTimeout(() => {
        console.log('ElevenLabs: Demo mode activated');
      }, 1000);
      return Promise.resolve();
    }

    try {
      console.log('Connecting to ElevenLabs Conversational AI...');
      
      // Use the standard WebSocket endpoint with headers
      const wsUrl = `wss://api.elevenlabs.io/v1/conversational-ai/conversation?agent_id=${this.config.agentId}`;
      
      return new Promise((resolve, reject) => {
        // Create WebSocket with custom headers
        this.websocket = new WebSocket(wsUrl, [], {
          headers: {
            'xi-api-key': this.config.apiKey,
            'Content-Type': 'application/json'
          }
        });

        this.websocket.onopen = () => {
          console.log('ElevenLabs WebSocket connected successfully');
          resolve();
        };

        this.websocket.onerror = (error) => {
          console.error('ElevenLabs WebSocket connection error:', error);
          reject(new Error('Failed to connect to ElevenLabs. Please check your API key and agent ID.'));
        };

        this.websocket.onmessage = this.handleWebSocketMessage.bind(this);

        this.websocket.onclose = (event) => {
          console.log('ElevenLabs WebSocket closed:', event.code, event.reason);
          this.websocket = null;
        };
      });
    } catch (error) {
      console.error('Error initializing ElevenLabs connection:', error);
      throw error;
    }
  }

  // Handle incoming WebSocket messages
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'agent_response':
          this.handleAgentResponse(data);
          break;
        case 'agent_response_streaming':
          this.handleStreamingResponse(data);
          break;
        case 'audio_chunk':
          this.handleAudioChunk(data);
          break;
        case 'error':
          this.handleError(data);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Handle agent text response
  private handleAgentResponse(data: any): void {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      role: 'agent',
      content: data.message,
      timestamp: new Date().toISOString(),
      isStreaming: false
    };

    this.currentConversation.push(message);
    this.onMessageCallback?.(message);
  }

  // Handle streaming response
  private handleStreamingResponse(data: any): void {
    const isComplete = data.is_final;
    this.onStreamingCallback?.(data.content, isComplete);

    if (isComplete) {
      const message: ConversationMessage = {
        id: Date.now().toString(),
        role: 'agent',
        content: data.full_content,
        timestamp: new Date().toISOString(),
        isStreaming: false
      };
      this.currentConversation.push(message);
      this.onMessageCallback?.(message);
    }
  }

  // Handle audio chunk for voice responses
  private async handleAudioChunk(data: any): Promise<void> {
    try {
      // Convert base64 audio to playable format
      const audioData = `data:audio/wav;base64,${data.audio}`;
      
      if (!this.soundObject) {
        this.soundObject = new Audio.AudioPlayer();
      }
      
      await this.soundObject.loadAsync({ uri: audioData });
      await this.soundObject.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  // Handle errors
  private handleError(data: any): void {
    console.error('ElevenLabs API Error:', data.message);
  }

  // Send text message to AI (supports seamless multimodal conversations)
  async sendTextMessage(text: string): Promise<void> {
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    this.currentConversation.push(userMessage);
    this.onMessageCallback?.(userMessage);

    // Check if we're in demo mode
    if (this.config.apiKey === 'your-api-key-here' || this.config.agentId.includes('agent-id')) {
      // Simulate AI response for development
      setTimeout(() => {
        this.simulateAIResponse(text);
      }, 1000);
      return;
    }

    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not available');
    }

    // ElevenLabs Conversational AI 2.0 supports seamless multimodal input
    // Text messages are sent directly and can be mixed with voice within the same conversation
    const message = {
      type: 'user_message',
      message: text,
      timestamp: Date.now()
    };

    this.websocket.send(JSON.stringify(message));
  }

  // Simulate AI response for demo mode
  private simulateAIResponse(userText: string): void {
    const responses = {
      'Language Coach': [
        "That's a great question about language development! For Gestalt Language Processors, it's important to remember that echolalia is actually a normal part of their language journey. Try modeling the language you want to see - for example, if they repeat 'Let's go!', you can expand it to 'Let's go to the park!' This gives them a richer language model to work with.",
        "I understand your concern about language progression. Every child develops at their own pace, and GLP children often show growth in bursts rather than linear progression. Focus on following their interests and providing rich language models during play. What activities does your child enjoy most?"
      ],
      'Parent Support': [
        "I hear you, and what you're feeling is completely valid. Parenting a child with different communication needs can be overwhelming at times. Remember that you're doing an amazing job by seeking support and information. Take it one day at a time, and be gentle with yourself.",
        "It's natural to feel this way. Many parents in similar situations experience these emotions. You're not alone in this journey, and it's okay to have difficult days. What helps me remember is that your love and consistency make such a difference, even when progress feels slow."
      ],
      'Child Mode': [
        "Wow, that sounds like so much fun! I love playing with blocks too. What are you building? Are you making a tall tower or maybe a house? I bet it's going to be amazing!",
        "That's awesome! Playing is such a great way to learn and use language. Tell me more about what you're doing. I'm excited to hear all about it!"
      ]
    };

    // Get current mode from agent config
    const currentMode = Object.keys(AGENT_CONFIGS).find(mode => 
      AGENT_CONFIGS[mode].agentId === this.config.agentId
    ) || 'Language Coach';

    const modeResponses = responses[currentMode as keyof typeof responses] || responses['Language Coach'];
    const randomResponse = modeResponses[Math.floor(Math.random() * modeResponses.length)];

    // Simulate streaming
    let streamedContent = '';
    const words = randomResponse.split(' ');
    
    words.forEach((word, index) => {
      setTimeout(() => {
        streamedContent += (index === 0 ? '' : ' ') + word;
        this.onStreamingCallback?.(streamedContent, index === words.length - 1);
        
        if (index === words.length - 1) {
          // Final message
          const aiMessage: ConversationMessage = {
            id: Date.now().toString(),
            role: 'agent',
            content: randomResponse,
            timestamp: new Date().toISOString()
          };
          this.currentConversation.push(aiMessage);
          this.onMessageCallback?.(aiMessage);
        }
      }, index * 100 + 500);
    });
  }

  // Start voice recording (supports seamless switching between voice and text)
  async startVoiceRecording(): Promise<void> {
    try {
      // Check for demo mode
      if (this.config.apiKey === 'your-api-key-here') {
        console.log('Voice recording started (demo mode)');
        return;
      }

      const { granted } = await Audio.requestRecordingPermissionsAsync();
      if (!granted) {
        throw new Error('Audio permission not granted');
      }

      const recordingOptions = {
        android: {
          extension: '.wav',
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
      };

      this.audioRecording = new Audio.AudioRecording();
      await this.audioRecording.prepareAsync(recordingOptions);
      await this.audioRecording.startAsync();
      console.log('Voice recording started');
    } catch (error) {
      console.error('Error starting voice recording:', error);
      throw error;
    }
  }

  // Stop voice recording and send to AI (seamless with text conversation)
  async stopVoiceRecording(): Promise<void> {
    try {
      // Check for demo mode
      if (this.config.apiKey === 'your-api-key-here') {
        console.log('Voice recording stopped (demo mode)');
        // Simulate voice message in demo mode
        const userMessage: ConversationMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: '[Voice message - demo]',
          timestamp: new Date().toISOString(),
          audioUrl: 'demo'
        };
        this.currentConversation.push(userMessage);
        this.onMessageCallback?.(userMessage);
        
        // Simulate AI response
        setTimeout(() => {
          this.simulateAIResponse('voice input');
        }, 1000);
        return;
      }

      if (!this.audioRecording) {
        throw new Error('No active recording');
      }

      await this.audioRecording.stopAsync();
      const uri = await this.audioRecording.getURI();
      
      if (uri && this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        // Convert audio to base64 and send
        // ElevenLabs Conversational AI 2.0 handles voice seamlessly within the same conversation
        const response = await fetch(uri);
        const blob = await response.blob();
        const base64Audio = await this.blobToBase64(blob);

        const message = {
          type: 'user_audio',
          audio: base64Audio,
          timestamp: Date.now()
        };

        this.websocket.send(JSON.stringify(message));

        // Add placeholder user message for voice input
        const userMessage: ConversationMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: '[Voice message]',
          timestamp: new Date().toISOString(),
          audioUrl: uri
        };

        this.currentConversation.push(userMessage);
        this.onMessageCallback?.(userMessage);
      }

      this.audioRecording = undefined;
    } catch (error) {
      console.error('Error stopping voice recording:', error);
      throw error;
    }
  }

  // Convert blob to base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Set message callback
  setOnMessageCallback(callback: (message: ConversationMessage) => void): void {
    this.onMessageCallback = callback;
  }

  // Set streaming callback
  setOnStreamingCallback(callback: (content: string, isComplete: boolean) => void): void {
    this.onStreamingCallback = callback;
  }

  // Get conversation history
  getConversationHistory(): ConversationMessage[] {
    return [...this.currentConversation];
  }

  // Clear conversation history
  clearConversation(): void {
    this.currentConversation = [];
  }

  // Change agent configuration
  async changeAgent(agentConfig: AgentConfig): Promise<void> {
    this.config.agentId = agentConfig.agentId;

    // Reconnect with new agent
    if (this.websocket) {
      this.websocket.close();
    }
    await this.initializeConnection();
  }

  // Cleanup resources
  async cleanup(): Promise<void> {
    try {
      if (this.audioRecording) {
        await this.audioRecording.stopAsync();
        this.audioRecording = undefined;
      }
      
      if (this.soundObject) {
        await this.soundObject.unloadAsync();
        this.soundObject = undefined;
      }

      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}