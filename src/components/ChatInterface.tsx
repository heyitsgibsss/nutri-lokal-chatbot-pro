
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
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
import { sendWhatsAppNotification, getWhatsAppConfig } from '@/services/whatsappService';
import { useParams } from 'react-router-dom';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize chat session
  useEffect(() => {
    const initializeChat = async () => {
      setIsInitializing(true);
      try {
        // If sessionId is provided, try to load that session
        if (sessionId) {
          const session = await getSessionById(sessionId);
          if (session) {
            const sessionMessages = await getSessionMessages(sessionId);
            setMessages(sessionMessages.map(msg => ({
              id: msg.id,
              content: msg.content,
              isUser: msg.is_user,
              timestamp: msg.timestamp
            })));
            setIsInitializing(false);
            return;
          }
        }
        
        // If no sessionId or session not found, create a new one
        const sessions = await getSessions();
        if (sessions.length > 0) {
          // Use the most recent session
          const mostRecent = sessions[0];
          setSessionId(mostRecent.id);
          const sessionMessages = await getSessionMessages(mostRecent.id);
          setMessages(sessionMessages.map(msg => ({
            id: msg.id,
            content: msg.content,
            isUser: msg.is_user,
            timestamp: msg.timestamp
          })));
        } else {
          // Create a new session
          const newSession = await createSession();
          if (newSession) {
            setSessionId(newSession.id);
            
            // Add welcome message
            if (newSession.id) {
              const welcomeMessage = {
                content: 'Selamat datang di NutriLokal! Silakan tanyakan tentang pangan lokal atau kebutuhan gizi Anda.',
                isUser: false,
                timestamp: new Date().toISOString(),
              };
              
              const savedMessage = await addMessage(newSession.id, welcomeMessage);
              if (savedMessage) {
                setMessages([savedMessage]);
              }
            }
          } else {
            toast({
              title: "Error",
              description: "Tidak dapat membuat sesi chat baru.",
              variant: "destructive",
            });
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
  }, [initialSessionId, routeSessionId, toast]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processResponse = async (userMessage: string) => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      
      // Here you would typically make an API call to your chatbot service
      // For this example, we'll simulate a response after a short delay
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Sample responses based on keywords in the user's message
      let botResponse = '';
      const lowerCaseMessage = userMessage.toLowerCase();
      
      if (lowerCaseMessage.includes('tempe')) {
        botResponse = 'Tempe adalah sumber protein nabati yang sangat baik. Mengandung 18-20g protein per 100g dan kaya akan antioksidan, vitamin B, dan mineral seperti zat besi dan kalsium.';
      } else if (lowerCaseMessage.includes('kangkung')) {
        botResponse = 'Kangkung kaya akan zat besi, vitamin A, C, dan mineral lainnya. Sangat baik untuk mencegah anemia dan menjaga kesehatan mata.';
      } else if (lowerCaseMessage.includes('ubi')) {
        botResponse = 'Ubi jalar, terutama yang berwarna oranye, kaya akan beta-karoten (provitamin A) yang penting untuk kesehatan mata. Juga mengandung serat dan vitamin C yang baik untuk pencernaan.';
      } else if (lowerCaseMessage.includes('gizi') || lowerCaseMessage.includes('nutrisi')) {
        botResponse = 'Pola gizi seimbang meliputi karbohidrat 50-60%, protein 15-20%, dan lemak 25-30% dari total kalori harian. Pangan lokal Indonesia sangat beragam dan dapat memenuhi kebutuhan gizi ini.';
      } else {
        botResponse = 'Terima kasih atas pertanyaan Anda. Pangan lokal Indonesia sangat beragam dan kaya nutrisi. Anda bisa bertanya lebih spesifik tentang jenis makanan tertentu, nilai gizinya, atau kebutuhan nutrisi harian.';
      }
      
      // Add bot response to chat
      const newBotMessage = {
        content: botResponse,
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      
      const savedBotMessage = await addMessage(sessionId, newBotMessage);
      if (savedBotMessage) {
        setMessages(prevMessages => [...prevMessages, savedBotMessage]);
      }
      
      // Send WhatsApp notification via Fonnte if enabled
      const whatsappConfig = getWhatsAppConfig();
      if (whatsappConfig.enabled && whatsappConfig.phoneNumber && whatsappConfig.apiKey) {
        const notificationContent = `NutriLokal: Ada pesan baru dari chatbot\n\nPertanyaan: ${userMessage}\n\nJawaban: ${botResponse}`;
        
        const notificationSent = await sendWhatsAppNotification(
          notificationContent, 
          whatsappConfig.phoneNumber, 
          whatsappConfig.apiKey
        );
        
        if (notificationSent) {
          console.log('WhatsApp notification sent successfully via Fonnte');
        } else {
          console.error('Failed to send WhatsApp notification via Fonnte');
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
    
    if (!input.trim() || isLoading || !sessionId) return;
    
    // Add user message to chat
    const userMessage = {
      content: input,
      isUser: true,
      timestamp: new Date().toISOString(),
    };
    
    const savedUserMessage = await addMessage(sessionId, userMessage);
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
