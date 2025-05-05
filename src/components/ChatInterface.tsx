
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import { 
  createSession, 
  addMessage, 
  getSessions, 
  getSessionById, 
  getSessionMessages 
} from '@/services/chatService';
import { sendMessageToGemini } from '@/services/geminiService';
import { Message } from '@/utils/types';
import { sendWhatsAppNotification, getWhatsAppConfig, formatRecipeForWhatsApp } from '@/services/whatsappService';
import { useParams, useLocation } from 'react-router-dom';

interface ChatInterfaceProps {
  initialSessionId?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialSessionId }) => {
  const { sessionId: routeSessionId } = useParams<{ sessionId?: string }>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId || routeSessionId);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasUserInput, setHasUserInput] = useState(false); // Track if the user has sent any messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // Initialize chat session
  useEffect(() => {
    const initializeChat = async () => {
      setIsInitializing(true);
      try {
        // Force start a new chat if on homepage and refreshing
        if (isHomePage) {
          // Create temporary welcome message (not saved to DB yet)
          const welcomeMessage = {
            id: `temp-${Date.now()}`,
            content: 'Selamat datang di NutriLokal! Silakan tanyakan tentang pangan lokal atau kebutuhan gizi Anda.',
            isUser: false,
            timestamp: new Date().toISOString(),
          };
          
          setMessages([welcomeMessage]);
          setSessionId(undefined);
          setHasUserInput(false);
          sessionStorage.removeItem('current_session_id');
          setIsInitializing(false);
          return;
        }
        
        // If on chat detail page, load that specific session
        if (routeSessionId) {
          const session = await getSessionById(routeSessionId);
          if (session) {
            const sessionMessages = await getSessionMessages(session.id);
            setMessages(sessionMessages.map(msg => ({
              id: msg.id,
              content: msg.content,
              isUser: msg.is_user,
              timestamp: msg.timestamp
            })));
            setSessionId(session.id);
            sessionStorage.setItem('current_session_id', session.id);
            
            // Check if this session has any user messages
            const hasUserMessages = sessionMessages.some(msg => msg.is_user);
            setHasUserInput(hasUserMessages);
            
            setIsInitializing(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat memuat data chat.",
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [initialSessionId, routeSessionId, toast, location.pathname, isHomePage]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create a real session in the database when needed
  const ensureSessionExists = async (): Promise<string> => {
    if (sessionId) {
      return sessionId;
    }
    
    // Create a new session in the database
    const newSession = await createSession();
    if (!newSession) {
      throw new Error("Failed to create chat session");
    }
    
    setSessionId(newSession.id);
    sessionStorage.setItem('current_session_id', newSession.id);
    
    // Add welcome message to the database
    const welcomeMessage = {
      content: 'Selamat datang di NutriLokal! Silakan tanyakan tentang pangan lokal atau kebutuhan gizi Anda.',
      isUser: false,
      timestamp: new Date().toISOString(),
    };
    
    await addMessage(newSession.id, welcomeMessage);
    
    return newSession.id;
  };

  const processResponse = async (userMessage: string) => {
    try {
      setIsLoading(true);
      
      // Ensure we have a valid session ID
      const currentSessionId = await ensureSessionExists();
      
      // Convert chat messages to format expected by Gemini
      const geminiMessages: Message[] = messages.map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content
      }));
      
      // Add the new user message
      geminiMessages.push({ role: "user", content: userMessage });
      
      // Get response from Gemini API
      const botResponse = await sendMessageToGemini(geminiMessages);
      
      // Add bot response to chat
      const newBotMessage = {
        content: botResponse,
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      
      const savedBotMessage = await addMessage(currentSessionId, newBotMessage);
      if (savedBotMessage) {
        setMessages(prevMessages => [...prevMessages, savedBotMessage]);
      }
      
      // Send WhatsApp notification via Fonnte if enabled and properly configured
      const whatsappConfig = getWhatsAppConfig();
      if (whatsappConfig.enabled && 
          whatsappConfig.phoneNumber && 
          whatsappConfig.phoneNumber.trim() !== '' && 
          whatsappConfig.apiKey && 
          whatsappConfig.apiKey.trim() !== '') {
        
        try {
          // Format the WhatsApp message with better recipe formatting if it contains recipe content
          const isRecipeQuery = userMessage.toLowerCase().includes('resep') || 
                              userMessage.toLowerCase().includes('masak') || 
                              userMessage.toLowerCase().includes('makanan');
          
          let notificationContent;
          if (isRecipeQuery) {
            // Format as a recipe notification
            notificationContent = formatRecipeForWhatsApp(userMessage, botResponse);
          } else {
            // Regular notification format
            notificationContent = `NutriLokal: Ada pesan baru dari chatbot\n\nPertanyaan: ${userMessage}\n\nJawaban: ${botResponse}`;
          }
          
          const notificationSent = await sendWhatsAppNotification(
            notificationContent, 
            whatsappConfig.phoneNumber, 
            whatsappConfig.apiKey
          );
          
          if (notificationSent) {
            console.log('WhatsApp notification sent successfully via Fonnte');
          } else {
            console.log('Failed to send WhatsApp notification via Fonnte');
          }
        } catch (whatsappError) {
          console.log('Error sending WhatsApp notification:', whatsappError);
          // Silently fail - don't break the chat experience if notifications fail
        }
      }
    } catch (error) {
      console.error('Error processing response:', error);
      toast({
        title: "Error",
        description: "Gagal mendapatkan respons. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Mark that user has provided input
    setHasUserInput(true);
    
    // Ensure session exists in database
    const currentSessionId = await ensureSessionExists();
    
    // Add user message to chat
    const userMessage = {
      content: input,
      isUser: true,
      timestamp: new Date().toISOString(),
    };
    
    const savedUserMessage = await addMessage(currentSessionId, userMessage);
    if (savedUserMessage) {
      setMessages(prevMessages => [...prevMessages, savedUserMessage]);
    }
    
    const userInput = input;
    setInput('');
    
    // Process the message and get a response
    await processResponse(userInput);
  };

  if (isInitializing) {
    return (
      <div className="bg-white rounded-lg shadow-md h-[500px] max-h-[500px] flex flex-col border border-gray-200 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nutrilokal-green" />
        <p className="mt-2 text-gray-600">Memuat percakapan...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md h-[500px] max-h-[500px] flex flex-col border border-gray-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.isUser 
                  ? 'bg-nutrilokal-blue text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.content}
              <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                {new Date(message.timestamp).toLocaleTimeString('id-ID', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-gray-600">Mendapatkan informasi...</span>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 flex">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis pertanyaan Anda di sini..."
          className="flex-grow min-h-[50px] resize-none"
          maxLength={500}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (input.trim()) handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="ml-2 bg-nutrilokal-green hover:bg-nutrilokal-green-dark"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;
