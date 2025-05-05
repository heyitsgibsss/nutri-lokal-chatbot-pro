import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Trash2, MessageCircle, Loader2 } from 'lucide-react';
import { getSessions, deleteSession } from '@/services/chatService';
import { ChatSession } from '@/types/chat';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useNavigate } from 'react-router-dom';

const ChatHistory: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      try {
        const savedSessions = await getSessions();
        setSessions(savedSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        toast({
          title: "Error",
          description: "Gagal memuat riwayat percakapan.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [toast]);

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const success = await deleteSession(sessionId);
      
      if (success) {
        // If we delete the current active session, remove it from sessionStorage
        const currentSessionId = sessionStorage.getItem('current_session_id');
        if (currentSessionId === sessionId) {
          sessionStorage.removeItem('current_session_id');
        }
        
        setSessions(sessions.filter(session => session.id !== sessionId));
        
        toast({
          title: "Percakapan dihapus",
          description: "Riwayat percakapan telah berhasil dihapus.",
        });
      } else {
        toast({
          title: "Error",
          description: "Gagal menghapus percakapan.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus percakapan.",
        variant: "destructive",
      });
    }
  };

  const handleViewChat = (sessionId: string) => {
    // Store the selected session ID before navigating
    sessionStorage.setItem('current_session_id', sessionId);
    navigate(`/chat/${sessionId}`);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-nutrilokal-blue-dark">Riwayat Percakapan</h1>
          
          {isLoading ? (
            <div className="text-center py-10">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-nutrilokal-green" />
              <p className="mt-2 text-gray-600">Memuat riwayat percakapan...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-gray-200">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-800">Belum ada percakapan</h3>
              <p className="text-gray-500 mt-2">Mulai percakapan baru dengan NutriLokal</p>
              <Link to="/">
                <Button className="mt-4 bg-nutrilokal-green hover:bg-nutrilokal-green-dark">
                  Mulai Percakapan
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-medium text-nutrilokal-green-dark">{session.title}</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteSession(session.id)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-gray-500 text-sm mb-3">
                    {formatDate(session.updated_at)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Dibuat: {formatDate(session.created_at)}
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-nutrilokal-blue hover:text-nutrilokal-blue-dark"
                      onClick={() => handleViewChat(session.id)}
                    >
                      Lihat Percakapan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ChatHistory;
