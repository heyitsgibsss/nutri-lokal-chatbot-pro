import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, MessageSquare, Camera, Image, X } from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import { 
  createSession, 
  addMessage, 
  getSessions, 
  getSessionById, 
  getSessionMessages 
} from '@/services/chatService';
import { 
  sendMessageToGemini, 
  sendImageToGemini 
} from '@/services/geminiService';
import { Message } from '@/utils/types';
import { 
  sendWhatsAppNotification, 
  getWhatsAppConfig, 
  formatRecipeForWhatsApp,
  sendRecipeToWhatsApp
} from '@/services/whatsappService';
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
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
            content: 'Selamat datang di NutriLokal! Berikut adalah beberapa rekomendasi makanan sehat dan terjangkau:\n\n1. Pepes Tahu dan Sayuran\n   - Benefits: Tinggi protein nabati, serat, dan mineral\n   - Bahan-bahan:\n     1. 5 buah tahu putih\n     2. 1 ikat bayam, cuci dan potong\n     3. 1 buah wortel, parut\n     4. 2 butir telur\n     5. Bumbu: bawang merah, bawang putih, ketumbar, garam secukupnya\n   - Langkah-langkah:\n     1. Hancurkan tahu, campurkan dengan sayuran dan bumbu\n     2. Tambahkan telur, aduk rata\n     3. Bungkus dengan daun pisang dan kukus selama 20 menit\n\n2. Bubur Kacang Hijau Ubi Oranye\n   - Benefits: Kaya serat, vitamin A, dan energi berkelanjutan\n   - Bahan-bahan:\n     1. 100g kacang hijau\n     2. 1 ubi oranye ukuran sedang\n     3. Gula aren secukupnya\n     4. 1 lembar daun pandan\n   - Langkah-langkah:\n     1. Rendam kacang hijau selama 2 jam\n     2. Rebus kacang hijau dengan daun pandan hingga empuk\n     3. Tambahkan ubi yang sudah dipotong dadu\n     4. Tambahkan gula aren, aduk hingga larut\n\nSilakan tanyakan tentang pangan lokal atau kebutuhan gizi Anda.',
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
              isUser: msg.isUser,
              timestamp: msg.timestamp
            })));
            setSessionId(session.id);
            sessionStorage.setItem('current_session_id', session.id);
            
            // Check if this session has any user messages
            const hasUserMessages = sessionMessages.some(msg => msg.isUser);
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
    
    // Add welcome message to the database with the new healthy food recommendations
    const welcomeMessage = {
      content: 'Selamat datang di NutriLokal! Berikut adalah beberapa rekomendasi makanan sehat dan terjangkau:\n\n1. Pepes Tahu dan Sayuran\n   - Benefits: Tinggi protein nabati, serat, dan mineral\n   - Bahan-bahan:\n     1. 5 buah tahu putih\n     2. 1 ikat bayam, cuci dan potong\n     3. 1 buah wortel, parut\n     4. 2 butir telur\n     5. Bumbu: bawang merah, bawang putih, ketumbar, garam secukupnya\n   - Langkah-langkah:\n     1. Hancurkan tahu, campurkan dengan sayuran dan bumbu\n     2. Tambahkan telur, aduk rata\n     3. Bungkus dengan daun pisang dan kukus selama 20 menit\n\n2. Bubur Kacang Hijau Ubi Oranye\n   - Benefits: Kaya serat, vitamin A, dan energi berkelanjutan\n   - Bahan-bahan:\n     1. 100g kacang hijau\n     2. 1 ubi oranye ukuran sedang\n     3. Gula aren secukupnya\n     4. 1 lembar daun pandan\n   - Langkah-langkah:\n     1. Rendam kacang hijau selama 2 jam\n     2. Rebus kacang hijau dengan daun pandan hingga empuk\n     3. Tambahkan ubi yang sudah dipotong dadu\n     4. Tambahkan gula aren, aduk hingga larut\n\nSilakan tanyakan tentang pangan lokal atau kebutuhan gizi Anda.',
      isUser: false,
      timestamp: new Date().toISOString(),
    };
    
    await addMessage(newSession.id, welcomeMessage);
    
    return newSession.id;
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      toast({
        title: "Error",
        description: "Hanya file gambar yang diperbolehkan.",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ukuran gambar terlalu besar (maks 5MB).",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processImageResponse = async (file: File) => {
    try {
      setIsLoading(true);
      
      // Ensure we have a valid session ID
      const currentSessionId = await ensureSessionExists();
      
      // Create a placeholder message to show the image being sent
      const userMessage = {
        content: "[Gambar makanan dikirim]",
        isUser: true,
        timestamp: new Date().toISOString(),
        imageUrl: URL.createObjectURL(file)
      };
      
      const savedUserMessage = await addMessage(currentSessionId, userMessage);
      if (savedUserMessage) {
        setMessages(prevMessages => [...prevMessages, savedUserMessage]);
      }
      
      // Convert the image to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        // Get response from Gemini API
        const botResponse = await sendImageToGemini(base64Image);
        
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
        
        setIsLoading(false);
      };
      
      // Clear the image after sending
      clearSelectedImage();
      
    } catch (error) {
      console.error('Error processing image response:', error);
      toast({
        title: "Error",
        description: "Gagal menganalisa gambar. Silakan coba lagi.",
        variant: "destructive",
      });
      setIsLoading(false);
      clearSelectedImage();
    }
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
            whatsappConfig.apiKey,
            whatsappConfig.deviceToken
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
    
    // If there's an image selected, process it instead of text
    if (selectedImage) {
      await processImageResponse(selectedImage);
      return;
    }
    
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

  // Handle sending message to WhatsApp
  const handleSendToWhatsApp = async (messageContent: string) => {
    const whatsappConfig = getWhatsAppConfig();
    
    if (!whatsappConfig.enabled || 
        !whatsappConfig.phoneNumber || 
        !whatsappConfig.apiKey) {
      toast({
        title: "WhatsApp tidak dikonfigurasi",
        description: "Silakan atur konfigurasi WhatsApp di halaman pengaturan terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSendingWhatsApp(true);
    
    try {
      const sent = await sendRecipeToWhatsApp(
        messageContent,
        whatsappConfig.phoneNumber,
        whatsappConfig.apiKey,
        whatsappConfig.deviceToken
      );
      
      if (sent) {
        toast({
          title: "Berhasil",
          description: "Resep berhasil dikirim ke WhatsApp Anda.",
        });
      } else {
        toast({
          title: "Gagal",
          description: "Gagal mengirim resep ke WhatsApp. Periksa konfigurasi Anda.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengirim ke WhatsApp.",
        variant: "destructive",
      });
      console.error('WhatsApp send error:', error);
    } finally {
      setIsSendingWhatsApp(false);
    }
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
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex flex-col">
              <div 
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.isUser 
                    ? 'bg-nutrilokal-blue text-white ml-auto' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {/* Show image if the message has an imageUrl */}
                {message.imageUrl && (
                  <div className="mb-2">
                    <img 
                      src={message.imageUrl} 
                      alt="Uploaded food" 
                      className="max-w-full rounded-lg" 
                    />
                  </div>
                )}
                
                {message.content}
                <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(message.timestamp).toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
              
              {/* WhatsApp button for assistant messages that contain recipes */}
              {!message.isUser && 
               (message.content.toLowerCase().includes('resep') || 
                message.content.toLowerCase().includes('bahan-bahan') ||
                message.content.toLowerCase().includes('langkah-langkah') ||
                index === 0) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2 w-fit flex gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  onClick={() => handleSendToWhatsApp(message.content)}
                  disabled={isSendingWhatsApp}
                >
                  {isSendingWhatsApp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  Kirim Resep ke WhatsApp
                </Button>
              )}
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
      
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        {/* Image preview area */}
        {imagePreview && (
          <div className="mb-3 relative">
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-16 rounded-md" 
              />
              <button
                type="button"
                onClick={clearSelectedImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      
        <div className="flex items-center">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {/* Camera/Image upload button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={triggerImageUpload}
            className="mr-2"
            disabled={isLoading}
          >
            <Image className="h-4 w-4" />
          </Button>
          
          {/* Text input */}
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
                if (input.trim() || selectedImage) handleSubmit(e);
              }
            }}
          />
          
          {/* Send button */}
          <Button 
            type="submit" 
            size="icon" 
            className="ml-2 bg-nutrilokal-green hover:bg-nutrilokal-green-dark"
            disabled={isLoading || (!input.trim() && !selectedImage)}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
