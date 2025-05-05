
// Chat message interfaces
export interface ChatMessage {
  id?: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  imageUrl?: string; // Added for image messages
}

export interface ChatSession {
  id: string;
  name: string;
  created_at: string;
  preview: string;
}

export interface WhatsAppConfig {
  enabled: boolean;
  phoneNumber: string;
  apiKey: string;
  provider: 'fonnte';
  deviceToken?: string;
}
