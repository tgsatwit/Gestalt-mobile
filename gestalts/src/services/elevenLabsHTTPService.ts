// ElevenLabs HTTP API Service (No Native Modules Required)
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

export class ElevenLabsConversationalAI {
  private config: {
    apiKey: string;
    agentId: string;
  };
  private websocket: WebSocket | null = null;
  private onMessageCallback?: (message: ConversationMessage) => void;
  private onStreamingCallback?: (content: string, isComplete: boolean) => void;

  constructor(config: { apiKey: string; agentId: string }) {
    this.config = config;
  }

  async initializeConnection(): Promise<void> {
    console.log('ElevenLabs WebSocket: Initializing connection');
    
    try {
      // First get a conversation token
      const tokenResponse = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${this.config.agentId}`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: HTTP ${tokenResponse.status}: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      const conversationToken = tokenData.conversation_token;
      
      console.log('ElevenLabs: Got conversation token');

      // Now establish WebSocket connection
      return new Promise((resolve, reject) => {
        this.websocket = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?conversation_token=${conversationToken}`);

        this.websocket.onopen = () => {
          console.log('ElevenLabs WebSocket: Connected successfully');
          resolve();
        };

        this.websocket.onerror = (error) => {
          console.error('ElevenLabs WebSocket: Connection error', error);
          reject(new Error('Failed to connect to ElevenLabs. Please check your API key and agent ID.'));
        };

        this.websocket.onmessage = this.handleWebSocketMessage.bind(this);

        this.websocket.onclose = (event) => {
          console.log('ElevenLabs WebSocket: Closed', event.code, event.reason);
          this.websocket = null;
        };
      });
    } catch (error) {
      console.error('ElevenLabs: Connection failed', error);
      throw error;
    }
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('ElevenLabs WebSocket: Received message', data);
      
      switch (data.type) {
        case 'agent_response':
          this.handleAgentResponse(data);
          break;
        case 'agent_response_streaming':
          this.handleStreamingResponse(data);
          break;
        case 'error':
          this.handleError(data);
          break;
      }
    } catch (error) {
      console.error('ElevenLabs WebSocket: Error parsing message', error);
    }
  }

  private handleAgentResponse(data: any): void {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      role: 'agent',
      content: data.message || data.text || 'Response received',
      timestamp: new Date().toISOString(),
      isStreaming: false
    };

    this.onMessageCallback?.(message);
  }

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
      this.onMessageCallback?.(message);
    }
  }

  private handleError(data: any): void {
    console.error('ElevenLabs WebSocket: API Error', data.message);
  }

  async sendTextMessage(text: string): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not available');
    }

    console.log('ElevenLabs WebSocket: Sending message', text);

    try {
      // Send user message through WebSocket
      const message = {
        type: 'user_transcript',
        text: text,
        user_id: 'user',
        timestamp: Date.now()
      };

      this.websocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('ElevenLabs WebSocket: Send message failed', error);
      throw error;
    }
  }

  setOnMessageCallback(callback: (message: ConversationMessage) => void): void {
    this.onMessageCallback = callback;
  }

  setOnStreamingCallback(callback: (content: string, isComplete: boolean) => void): void {
    this.onStreamingCallback = callback;
  }

  async cleanup(): Promise<void> {
    if (this.websocket) {
      try {
        this.websocket.close();
        console.log('ElevenLabs WebSocket: Connection closed');
      } catch (error) {
        console.error('ElevenLabs WebSocket: Error closing connection', error);
      }
      this.websocket = null;
    }
  }
}