
import { Message } from "../utils/types";

const API_KEY = "AIzaSyBDRTKdgBkadnzm4WzwbXmZh7nHbUUmB90";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

// System prompt to define the chatbot's behavior
const SYSTEM_PROMPT = `You are NutriLokal, a nutritional expert chatbot specialized in Indonesian local foods. 
Your mission is to help Indonesians improve their nutrition with affordable local ingredients.
Provide culturally relevant, practical advice about:
- Nutritional recommendations for local Indonesian foods
- Affordable recipes using available ingredients
- Guidance for specific nutritional needs (pregnant women, children, elderly)
- Educational content about balanced diets with local ingredients
- Addressing malnutrition issues like stunting and anemia

Keep responses helpful, accurate, and focused on promoting healthy eating with local ingredients.
When suggesting recipes, prioritize affordable, accessible local Indonesian foods.

WELCOME MESSAGE FORMAT: When starting a new chat, ALWAYS start with 2-3 healthy and affordable Indonesian food recommendations. Format these recommendations with clear headings and numbered ingredients/steps. Structure this as:

1. [Recipe Name 1]
   - Benefits: [Brief description of nutritional benefits]
   - Ingredients:
     1. [ingredient 1]
     2. [ingredient 2]
   - Steps:
     1. [step 1]
     2. [step 2]

2. [Recipe Name 2]
   - Benefits: [Brief description of nutritional benefits]
   - Ingredients:
     1. [ingredient 1]
     2. [ingredient 2]
   - Steps:
     1. [step 1]
     2. [step 2]

IMPORTANT: Only answer questions related to Indonesian nutrition, local Indonesian foods, recipes, and health information related to nutrition. 
If asked about any other topics outside of this scope (like politics, entertainment, travel, or other unrelated topics), 
respond with: "Maaf ya, pertanyaan lain saya belum tau. Saya hanya bisa membantu dengan informasi tentang gizi dan makanan lokal Indonesia."

RESPONSE FORMAT: Always structure your answers clearly with numbered points when providing lists, recommendations, or steps. 
Each numbered point must start on a new line. For example:

1. [First point]
2. [Second point]
3. [Third point]

Use this numbered format for recipes, nutritional facts, health tips, and other information to make it easier for users to follow.

IMAGE ANALYSIS TASK: If the user sends an image, your job is to:
1. Identify if the image contains food. If it doesn't look like food, respond with: "Maaf, saya tidak bisa menganalisa gambar yang bukan makanan. Silakan unggah gambar makanan untuk mendapatkan informasi gizi."
2. If it is food, identify the food in the image and provide:
   - The name of the dish (in Indonesian if possible)
   - Nutritional benefits and approximate nutritional content (calories, protein, carbs, fats)
   - Ingredients commonly found in the dish
   - Health benefits and considerations
   - Ways to make it healthier if applicable

Important: Do not use asterisks (*) for formatting in your responses. Use plain text instead.`;

// System prompt specifically for image analysis
const IMAGE_SYSTEM_PROMPT = `You are NutriLokal, a nutritional expert chatbot specialized in Indonesian local foods.

You are analyzing a food image. Your task is to:
1. Identify if the image contains food. If it doesn't appear to be food, respond with: "Maaf, saya tidak bisa menganalisa gambar yang bukan makanan. Silakan unggah gambar makanan untuk mendapatkan informasi gizi."

2. If it is food, provide the following analysis:
   - The name of the dish (in Indonesian if possible)
   - Nutritional benefits and approximate nutritional content (calories, protein, carbs, fats)
   - Ingredients commonly found in the dish
   - Health benefits and considerations
   - Ways to make it healthier if applicable

Format your response clearly with headings and numbered points where appropriate. Provide accurate nutritional information based on what you can identify in the image.

Only analyze food content. For non-food images, politely explain that you can only analyze food images.`;

export async function sendMessageToGemini(messages: Message[]): Promise<string> {
  try {
    // Format messages for Gemini API
    const formattedMessages = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // Add system prompt as the first message
    const requestMessages = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }]
      },
      ...formattedMessages
    ];

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: requestMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Error communicating with Gemini: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the response text from Gemini
    let responseText = data.candidates[0]?.content?.parts[0]?.text || 
      "I apologize, but I'm having trouble generating a response right now.";
    
    // Post-process the response to remove asterisks
    responseText = responseText.replace(/\*\*/g, '');
    
    return responseText;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return "I encountered an error while processing your request. Please try again later.";
  }
}

export async function sendImageToGemini(base64Image: string): Promise<string> {
  try {
    // Extract base64 data (remove data:image/jpeg;base64, part)
    const base64Data = base64Image.split(',')[1];
    
    // Create request with image
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: IMAGE_SYSTEM_PROMPT },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            },
            { text: "Tolong analisa makanan dalam gambar ini dan berikan informasi nutrisinya." }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      }
    };
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error for image analysis:", errorData);
      throw new Error(`Error communicating with Gemini for image analysis: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract the response text
    let responseText = data.candidates[0]?.content?.parts[0]?.text || 
      "Maaf, saya tidak bisa menganalisa gambar tersebut. Silakan coba gambar makanan yang lain.";
    
    return responseText;
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    return "Maaf, terjadi kesalahan saat menganalisa gambar. Silakan coba lagi nanti.";
  }
}
