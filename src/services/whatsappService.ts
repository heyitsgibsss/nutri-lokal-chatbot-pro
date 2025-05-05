
import { WhatsAppConfig } from "@/types/chat";

const WHATSAPP_CONFIG_KEY = 'nutrilokal-whatsapp-config';
const DEFAULT_DEVICE_TOKEN = 'Rs3jgVypgwVVAQAFnzbR'; // Default Fonnte device token

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
    provider: 'fonnte',
    deviceToken: DEFAULT_DEVICE_TOKEN
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
    
    // Use data array format as shown in the example
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        data: JSON.stringify([{
          target: formattedPhone,
          message: message,
          delay: "0"
        }]),
        sequence: "true"
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
    
    // Use data array format as shown in the example
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        data: JSON.stringify([{
          target: formattedPhone,
          message: formattedMessage,
          delay: "0"
        }]),
        sequence: "true"
      })
    });
    
    const data = await response.json();
    console.log('Fonnte API response:', data);
    return data && data.status === true;
  } catch (error) {
    console.error('Error sending recipe to WhatsApp:', error);
    return false;
  }
};

// Test webhook connection with Fonnte
export const testFonnteConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.fonnte.com/device', {
      method: 'GET',
      headers: {
        'Authorization': apiKey
      }
    });
    
    const data = await response.json();
    console.log('Fonnte device status:', data);
    
    // Check if the connection was successful
    return data && data.status === true;
  } catch (error) {
    console.error('Error testing Fonnte connection:', error);
    return false;
  }
};
