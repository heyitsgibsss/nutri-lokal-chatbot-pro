
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-lg font-bold mb-2">
              <span className="text-nutrilokal-green-dark">Nutri</span>
              <span className="text-nutrilokal-blue-dark">Lokal</span>
            </h2>
            <p className="text-gray-600 max-w-md">
              Solusi gizi berbasis pangan lokal untuk kesehatan yang optimal dan berkelanjutan.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-3 text-gray-800">Tentang</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-600 hover:text-nutrilokal-green-dark">
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-600 hover:text-nutrilokal-green-dark">
                    Kontak
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-gray-800">Bantuan</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/faq" className="text-gray-600 hover:text-nutrilokal-green-dark">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-600 hover:text-nutrilokal-green-dark">
                    Privasi
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} NutriLokal. Hak Cipta Dilindungi.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
