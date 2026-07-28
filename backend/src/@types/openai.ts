export interface IOpenAi {
    name: string;
    prompt: string;
    voice: string;
    voiceKey: string;
    voiceRegion: string;
    maxTokens: number;
    temperature: number;
    apiKey: string;
    queueId: number;
    maxMessages: number;
    model: string; 
  }
  