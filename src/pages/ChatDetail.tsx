
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getSessionById } from '@/services/chatService';
import { ChatSession } from '@/types/chat';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatInterface from '@/components/ChatInterface';

const ChatDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<ChatSession | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionId) {
      const chatSession = getSessionById(sessionId);
      if (chatSession) {
        setSession(chatSession);
      } else {
        navigate('/chat-history');
      }
    }
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/chat-history')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Kembali
            </Button>
            
            {session && (
              <h1 className="text-xl font-bold text-nutrilokal-blue-dark">
                {session.title}
              </h1>
            )}
          </div>
          
          {session ? (
            <ChatInterface />
          ) : (
            <div className="text-center py-8">
              <p>Percakapan tidak ditemukan</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ChatDetail;
