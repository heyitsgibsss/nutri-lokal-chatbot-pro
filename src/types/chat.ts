
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  session_id?: string;
  is_user?: boolean; // Database field name
}

export interface ChatSession {
  id: string;
  title: string;
  messages?: ChatMessage[];
  created_at: string;
  updated_at: string;
  createdAt?: string; // For backward compatibility
  updatedAt?: string; // For backward compatibility
}

export interface WhatsAppConfig {
  enabled: boolean;
  phoneNumber: string;
  apiKey: string;
  provider: 'fonnte';
}
