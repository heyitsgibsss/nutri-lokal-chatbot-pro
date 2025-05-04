
import React from 'react';

const InfoSection: React.FC = () => {
  const infoCards = [
    {
      title: 'Pangan Lokal Sehat',
      description: 'Makanan lokal Indonesia memiliki kekayaan gizi yang tidak dimiliki makanan impor.',
      icon: '🌱'
    },
    {
      title: 'Riwayat Chat',
      description: 'Semua percakapan dengan NutriLokal disimpan untuk referensi di masa depan.',
      icon: '💬'
    },
    {
      title: 'Notifikasi WhatsApp',
      description: 'Dapatkan saran gizi dan pengingat langsung ke WhatsApp Anda melalui Fonnte.',
      icon: '📱'
    }
  ];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-center mb-6 text-nutrilokal-green-dark">
        Fitur NutriLokal
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {infoCards.map((card, index) => (
          <div 
            key={index}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <h3 className="font-medium text-lg mb-2 text-nutrilokal-blue-dark">{card.title}</h3>
            <p className="text-gray-600">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default InfoSection;
