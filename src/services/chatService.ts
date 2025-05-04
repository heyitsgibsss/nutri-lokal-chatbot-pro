
import { ChatMessage, ChatSession } from "@/types/chat";

const SESSIONS_STORAGE_KEY = 'nutrilokal-chat-sessions';

// Generate a unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Save sessions to localStorage
export const saveSessions = (sessions: ChatSession[]): void => {
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
};

// Get all sessions from localStorage
export const getSessions = (): ChatSession[] => {
  const sessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
  return sessions ? JSON.parse(sessions) : [];
};

// Create a new session
export const createSession = (): ChatSession => {
  const newSession: ChatSession = {
    id: generateId(),
    title: `Chat ${new Date().toLocaleDateString('id-ID')}`,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const sessions = getSessions();
  sessions.unshift(newSession);
  saveSessions(sessions);
  
  return newSession;
};

// Get session by ID
export const getSessionById = (sessionId: string): ChatSession | undefined => {
  const sessions = getSessions();
  return sessions.find((session) => session.id === sessionId);
};

// Add message to a session
export const addMessage = (sessionId: string, message: Omit<ChatMessage, 'id'>): ChatMessage => {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
  
  if (sessionIndex === -1) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  const newMessage: ChatMessage = {
    id: generateId(),
    ...message,
  };
  
  sessions[sessionIndex].messages.push(newMessage);
  sessions[sessionIndex].updatedAt = new Date().toISOString();
  
  // Update title for the first user message if there's only one message
  if (message.isUser && sessions[sessionIndex].messages.length === 1) {
    const shortenedContent = message.content.substring(0, 20) + (message.content.length > 20 ? '...' : '');
    sessions[sessionIndex].title = shortenedContent;
  }
  
  saveSessions(sessions);
  return newMessage;
};

// Delete a session
export const deleteSession = (sessionId: string): void => {
  let sessions = getSessions();
  sessions = sessions.filter((session) => session.id !== sessionId);
  saveSessions(sessions);
};

// Clear all sessions
export const clearSessions = (): void => {
  saveSessions([]);
};
