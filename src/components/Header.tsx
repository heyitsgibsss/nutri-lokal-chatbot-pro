
import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold">
            <span className="text-nutrilokal-green-dark">Nutri</span>
            <span className="text-nutrilokal-blue-dark">Lokal</span>
          </h1>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Beta</span>
        </div>
        
        <nav className="flex items-center space-x-2">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-gray-600">
              Beranda
            </Button>
          </Link>
          <Link to="/chat-history">
            <Button variant="ghost" size="sm" className="text-gray-600">
              <MessageSquare className="w-4 h-4 mr-1" />
              Riwayat
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Settings className="w-4 h-4 mr-1" />
              Pengaturan
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
