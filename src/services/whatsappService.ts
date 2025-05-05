
export const sendWhatsAppNotification = async (
  message: "Halo, ini pesan dari Nutrilokal!",
  phoneNumber: "+62182195759381",
  message: string,
  phoneNumber: string = '+6282195759381',
  apiKey: string = '1MHmjzzcuvq7qEbhY8dUn2wR3vEz91PkbEvsfC',
  deviceToken: string = DEFAULT_DEVICE_TOKEN
): Promise<boolean> => {
  const apiKey = 'jbBn9PMyMNvr1UoGLRFZ'; // Use your actual Fonnte API key

  try {
    console.log(`Sending WhatsApp notification to: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log(`Sending WhatsApp notification to: ${phoneNumber} via Fonnte`);
    console.log(`Message content: ${message}`);
    console.log(`Using device token: ${deviceToken}`);
    
    if (!apiKey) {
      console.error('Fonnte API key is missing');
      return false;
    }

    if (!phoneNumber) {
      console.error('Phone number is required');
      return false;
    }

    // Fonnte typically expects the number without a leading '+'
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
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
          device: deviceToken,
          delay: "0"
        }]),
        sequence: "true"
      })
    });

    const data = await response.json();
    console.log('Fonnte API response:', data);

    return data && data.status === true;
  } catch (error) {
    console.error('Error sending WhatsApp via Fonnte:', error);
    return false;
  }
};

// Send recipe directly to WhatsApp
export const sendRecipeToWhatsApp = async (
  recipe: string,
  phoneNumber: string = '+6282195759381',
  apiKey: string = '1MHmjzzcuvq7qEbhY8dUn2wR3vEz91PkbEvsfC',
  deviceToken: string = DEFAULT_DEVICE_TOKEN
): Promise<boolean> => {
  try {
    console.log(`Sending recipe to WhatsApp using device token: ${deviceToken}`);
    
    if (!apiKey || !phoneNumber) {
      return false;
    }
    
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
    
    // Format recipe message
    const formattedMessage = `*NutriLokal: Resep Makanan Indonesia*\n\n${recipe}`;
    
    // Use data array format with device token
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
          device: deviceToken,
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
export const testFonnteConnection = async (
  apiKey: string = '1MHmjzzcuvq7qEbhY8dUn2wR3vEz91PkbEvsfC',
  deviceToken: string = DEFAULT_DEVICE_TOKEN
): Promise<boolean> => {
  try {
    console.log(`Testing Fonnte connection with device token: ${deviceToken}`);
    
    // Menggunakan endpoint /send untuk tes koneksi dengan pesan pengujian
    // karena endpoint /device menghasilkan "Method Not Allowed"
    const testPhone = '6282195759381'; // Gunakan nomor default untuk tes
    const testMessage = "Test koneksi NutriLokal";
    
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        data: JSON.stringify([{
          target: testPhone,
          message: testMessage,
          device: deviceToken,
          delay: "0"
        }]),
        sequence: "true"
      })
    });
    
    const data = await response.json();
    console.log('Fonnte test connection response:', data);
    
    // Check if the connection was successful
    return data && data.status === true;
  } catch (error) {
    console.error('Error testing Fonnte connection:', error);
    return false;
  }
};
