
import { WhatsAppConfig } from "@/types/chat";

const WHATSAPP_CONFIG_KEY = 'nutrilokal-whatsapp-config';

// Save WhatsApp config to localStorage
export const saveWhatsAppConfig = (config: WhatsAppConfig): void => {
  localStorage.setItem(WHATSAPP_CONFIG_KEY, JSON.stringify(config));
};

// Get WhatsApp config from localStorage
export const getWhatsAppConfig = (): WhatsAppConfig => {
  const config = localStorage.getItem(WHATSAPP_CONFIG_KEY);
  return config ? JSON.parse(config) : {
    enabled: false,
    phoneNumber: '',
    apiKey: '',
    provider: 'fonnte'
  };
};

// Format recipe content for WhatsApp notification
export const formatRecipeForWhatsApp = (recipeName: string, content: string): string => {
  // Extract just the recipe part of a longer message if it exists
  let recipeContent = content;
  
  // Look for recipe headers in the content
  const recipeMarkers = [
    'Resep 1:', 'Resep 2:', 'Resep 3:', 'Resep:', 'Bahan-bahan:', 'Cara membuat:'
  ];
  
  // Find if the content contains recipe sections
  for (const marker of recipeMarkers) {
    if (content.includes(marker)) {
      // We found a recipe section, use the original content
      return `*NutriLokal: Resep Makanan Indonesia*\n\n${recipeName}\n\n${content}`;
    }
  }
  
  // If no specific recipe markers found, just send the content as is
  return `*NutriLokal: Resep Makanan Indonesia*\n\n${content}`;
};

// Send WhatsApp notification via Fonnte API
export const sendWhatsAppNotification = async (
  message: string,
  phoneNumber: string,
  apiKey: string
): Promise<boolean> => {
  try {
    console.log(`Sending WhatsApp notification to: ${phoneNumber} via Fonnte`);
    console.log(`Message content: ${message}`);
    
    // Validate API key and phone number
    if (!apiKey) {
      console.error('Missing API key for Fonnte');
      return false;
    }
    
    if (!phoneNumber) {
      console.error('Missing phone number');
      return false;
    }
    
    // Format phone number if needed (remove '+' as Fonnte may not need it)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
    
    // Call Fonnte API with the new format
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message
      })
    });
    
    const data = await response.json();
    console.log('Fonnte API response:', data);
    
    // Check if the message was sent successfully
    return data && data.status === true;
    
  } catch (error) {
    console.error('Error sending WhatsApp notification via Fonnte:', error);
    return false;
  }
};

// Send recipe directly to WhatsApp
export const sendRecipeToWhatsApp = async (
  recipe: string,
  phoneNumber: string,
  apiKey: string
): Promise<boolean> => {
  try {
    if (!apiKey || !phoneNumber) {
      return false;
    }
    
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
    
    // Format recipe message
    const formattedMessage = `*NutriLokal: Resep Makanan Indonesia*\n\n${recipe}`;
    
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: formattedMessage
      })
    });
    
    const data = await response.json();
    return data && data.status === true;
  } catch (error) {
    console.error('Error sending recipe to WhatsApp:', error);
    return false;
  }
};
