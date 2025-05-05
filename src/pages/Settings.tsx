
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getWhatsAppConfig, saveWhatsAppConfig, testFonnteConnection } from '@/services/whatsappService';
import { clearSessions } from '@/services/chatService';
import { Loader2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { WhatsAppConfig } from '@/types/chat';

const Settings: React.FC = () => {
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfig>({
    enabled: false,
    phoneNumber: '',
    apiKey: '',
    provider: 'fonnte',
    deviceToken: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  useEffect(() => {
    const config = getWhatsAppConfig();
    setWhatsAppConfig(config);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate phone number format
      if (whatsAppConfig.enabled && !whatsAppConfig.phoneNumber.match(/^\+?[0-9]{10,15}$/)) {
        toast({
          title: "Format nomor tidak valid",
          description: "Masukkan nomor WhatsApp dengan format yang benar (contoh: +628123456789)",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Validate API key if WhatsApp is enabled
      if (whatsAppConfig.enabled && !whatsAppConfig.apiKey) {
        toast({
          title: "API Key diperlukan",
          description: "Masukkan API Key Fonnte untuk mengaktifkan notifikasi WhatsApp",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Save WhatsApp configuration
      saveWhatsAppConfig(whatsAppConfig);
      
      toast({
        title: "Pengaturan disimpan",
        description: whatsAppConfig.enabled 
          ? "Notifikasi WhatsApp resep makanan melalui Fonnte telah diaktifkan" 
          : "Notifikasi WhatsApp telah dinonaktifkan",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      if (!whatsAppConfig.apiKey) {
        toast({
          title: "API Key diperlukan",
          description: "Masukkan API Key Fonnte untuk menguji koneksi",
          variant: "destructive",
        });
        return;
      }
      
      const isConnected = await testFonnteConnection(whatsAppConfig.apiKey);
      
      if (isConnected) {
        setConnectionStatus('success');
        toast({
          title: "Koneksi berhasil",
          description: "Koneksi ke Fonnte WhatsApp API berhasil",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Koneksi gagal",
          description: "Gagal terhubung ke Fonnte WhatsApp API. Pastikan API key valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('Error testing connection:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menguji koneksi. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat percakapan? Tindakan ini tidak dapat dibatalkan.')) {
      clearSessions();
      toast({
        title: "Riwayat dihapus",
        description: "Semua riwayat percakapan telah berhasil dihapus.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-nutrilokal-blue-dark">Pengaturan</h1>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-medium mb-4 text-nutrilokal-green-dark">Notifikasi Resep Makanan via WhatsApp (Fonnte)</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="flex items-center space-x-2 mb-6">
                <Switch
                  checked={whatsAppConfig.enabled}
                  onCheckedChange={(checked) => setWhatsAppConfig(prev => ({ ...prev, enabled: checked }))}
                  id="whatsapp-enabled"
                />
                <Label htmlFor="whatsapp-enabled" className="text-gray-700">
                  {whatsAppConfig.enabled ? 'Aktif' : 'Nonaktif'}
                </Label>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-number" className="text-gray-700">
                    Nomor WhatsApp
                  </Label>
                  <Input
                    id="phone-number"
                    type="text"
                    placeholder="+628123456789"
                    value={whatsAppConfig.phoneNumber}
                    onChange={(e) => setWhatsAppConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    disabled={!whatsAppConfig.enabled}
                  />
                  <p className="text-xs text-gray-500">
                    Masukkan nomor WhatsApp dengan kode negara (contoh: +62 untuk Indonesia)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-gray-700">
                    API Key Fonnte
                  </Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Masukkan API key dari dashboard Fonnte Anda"
                    value={whatsAppConfig.apiKey || ''}
                    onChange={(e) => setWhatsAppConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    disabled={!whatsAppConfig.enabled}
                  />
                  <p className="text-xs text-gray-500">
                    Dapatkan API key dari dashboard <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-nutrilokal-blue hover:underline">Fonnte</a>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="device-token" className="text-gray-700">
                    Token Device Fonnte
                  </Label>
                  <Input
                    id="device-token"
                    type="text"
                    placeholder="Masukkan token device Fonnte Anda"
                    value={whatsAppConfig.deviceToken || ''}
                    onChange={(e) => setWhatsAppConfig(prev => ({ ...prev, deviceToken: e.target.value }))}
                    disabled={!whatsAppConfig.enabled}
                  />
                  <p className="text-xs text-gray-500">
                    Token device untuk akun Fonnte Anda
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="mt-2"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !whatsAppConfig.apiKey}
                  >
                    {testingConnection ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : connectionStatus === 'success' ? (
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    ) : connectionStatus === 'error' ? (
                      <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                    ) : null}
                    Uji Koneksi
                  </Button>
                </div>
                
                <div className="p-4 bg-green-50 rounded-md border border-green-100">
                  <h3 className="font-medium text-green-800 mb-2">Tentang Notifikasi Resep Makanan</h3>
                  <p className="text-sm text-green-700">
                    Setelah aktif, Anda akan menerima pesan WhatsApp dengan resep makanan setiap kali ada 
                    pertanyaan tentang resep makanan atau nutrisi. Pesan akan diformat khusus agar mudah dibaca.
                  </p>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="mt-6 bg-nutrilokal-green hover:bg-nutrilokal-green-dark"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : 'Simpan Pengaturan'}
              </Button>
            </form>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4 text-nutrilokal-green-dark">Hapus Data</h2>
            <p className="text-gray-600 mb-4">
              Hapus semua data dan riwayat percakapan. Tindakan ini tidak dapat dibatalkan.
            </p>
            <Button 
              variant="destructive" 
              onClick={handleClearHistory}
              className="flex items-center"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Semua Riwayat
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Settings;
