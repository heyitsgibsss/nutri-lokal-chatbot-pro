import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import { createSession, addMessage, getSessions } from '@/services/chatService';
import { sendWhatsAppNotification, getWhatsAppConfig } from '@/services/whatsappService';

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize a new chat session if none exists
  useEffect(() => {
    if (!sessionId) {
      const sessions = getSessions();
      // If there are existing sessions, use the most recent one
      if (sessions.length > 0) {
        const mostRecent = sessions[0];
        setSessionId(mostRecent.id);
        setMessages(mostRecent.messages);
      } else {
        // Otherwise create a new session
        const newSession = createSession();
        setSessionId(newSession.id);
        
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: '1',
          content: 'Selamat datang di NutriLokal! Silakan tanyakan tentang pangan lokal atau kebutuhan gizi Anda.',
          isUser: false,
          timestamp: new Date().toISOString(),
        };
        
        addMessage(newSession.id, {
          content: welcomeMessage.content,
          isUser: welcomeMessage.isUser,
          timestamp: welcomeMessage.timestamp,
        });
        
        setMessages([welcomeMessage]);
      }
    }
  }, []);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processResponse = async (userMessage: string) => {
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
      const newBotMessage: Omit<ChatMessage, 'id'> = {
        content: botResponse,
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      
      const savedBotMessage = addMessage(sessionId, newBotMessage);
      setMessages(prevMessages => [...prevMessages, savedBotMessage]);
      
      // Send WhatsApp notification if enabled
      const whatsappConfig = getWhatsAppConfig();
      if (whatsappConfig.enabled && whatsappConfig.phoneNumber && whatsappConfig.apiKey) {
        const notificationContent = `NutriLokal: Ada pesan baru dari chatbot\n\nPertanyaan: ${userMessage}\n\nJawaban: ${botResponse}`;
        
        const notificationSent = await sendWhatsAppNotification(
          notificationContent, 
          whatsappConfig.phoneNumber, 
          whatsappConfig.apiKey || ''
        );
        
        if (notificationSent) {
          console.log('WhatsApp notification sent successfully');
        } else {
          console.error('Failed to send WhatsApp notification');
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
    
    // Add user message to chat
    const userMessage: Omit<ChatMessage, 'id'> = {
      content: input,
      isUser: true,
      timestamp: new Date().toISOString(),
    };
    
    const savedUserMessage = addMessage(sessionId, userMessage);
    setMessages(prevMessages => [...prevMessages, savedUserMessage]);
    
    const userInput = input;
    setInput('');
    
    // Process the message and get a response
    await processResponse(userInput);
  };

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
