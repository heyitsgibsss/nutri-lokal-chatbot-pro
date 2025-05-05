
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
  title: string;        // Changed from 'name' to match the database
  created_at: string;   // Using snake_case to match the database structure
  updated_at: string;   // Using snake_case to match the database structure
  // Removing 'preview' as it's not used in the codebase
}

export interface WhatsAppConfig {
  enabled: boolean;
  phoneNumber: string;
  apiKey: string;
  provider: 'fonnte';
  deviceToken: string; // Added device token field
}
