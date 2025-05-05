
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage, ChatSession } from "@/types/chat";

// Generate a unique ID (used for temporary local messages)
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Get all sessions from Supabase
export const getSessions = async (): Promise<ChatSession[]> => {
  try {
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
    
    return sessions;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
};

// Create a new session in Supabase
export const createSession = async (): Promise<ChatSession | null> => {
  try {
    const newSession = {
      title: `Chat ${new Date().toLocaleDateString('id-ID')}`,
    };
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert(newSession)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating session:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
};

// Get session by ID from Supabase
export const getSessionById = async (sessionId: string): Promise<ChatSession | null> => {
  try {
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
};

// Get messages for a session from Supabase
export const getSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    // Transform to match our app's ChatMessage structure
    return messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      isUser: msg.is_user,
      timestamp: msg.timestamp,
      session_id: msg.session_id,
      is_user: msg.is_user
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

// Add message to a session in Supabase
export const addMessage = async (
  sessionId: string, 
  message: Omit<ChatMessage, 'id'>
): Promise<ChatMessage | null> => {
  try {
    const newMessage = {
      session_id: sessionId,
      content: message.content,
      is_user: message.isUser,
      timestamp: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(newMessage)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    // Update session title for the first user message
    if (message.isUser) {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_user', true);
      
      if (messages && messages.length === 1) {
        const shortenedContent = message.content.substring(0, 20) + (message.content.length > 20 ? '...' : '');
        updateSessionTitle(sessionId, shortenedContent);
      }
    }
    
    // Transform to match our app's ChatMessage structure
    return {
      id: data.id,
      content: data.content,
      isUser: data.is_user,
      timestamp: data.timestamp
    };
  } catch (error) {
    console.error('Error adding message:', error);
    return null;
  }
};

// Update session title
export const updateSessionTitle = async (sessionId: string, title: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error updating session title:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating session title:', error);
    return false;
  }
};

// Delete a session from Supabase
export const deleteSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error deleting session:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
};

// Clear all sessions
export const clearSessions = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all sessions
    
    if (error) {
      console.error('Error clearing sessions:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return false;
  }
};
