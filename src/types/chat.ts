
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppConfig {
  enabled: boolean;
  phoneNumber: string;
  apiKey?: string; 
}
