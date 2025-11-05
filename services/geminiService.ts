import { GoogleGenAI, Modality, Type } from "@google/genai";

export async function generateMockup(
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const generatedImages: string[] = [];
    
    // Check if response has the expected structure
    if (!response.candidates || response.candidates.length === 0) {
      console.error("No candidates in response:", response);
      throw new Error("AI'dan yanıt alınamadı. İstek engellenmiş olabilir.");
    }

    const candidate = response.candidates[0];
    
    // Check for finish reason first (this is the most common issue)
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.error("Generation stopped with reason:", candidate.finishReason);
      console.error("Full candidate:", candidate);
      
      // Provide user-friendly error messages based on finish reason
      switch (candidate.finishReason) {
        case 'NO_IMAGE':
          throw new Error('Görsel oluşturulamadı. Lütfen farklı bir görsel veya prompt deneyin. Görselinizin net ve yüksek kaliteli olduğundan emin olun.');
        case 'SAFETY':
          throw new Error('İçerik güvenlik filtreleri tarafından engellendi. Lütfen farklı bir görsel veya açıklama deneyin.');
        case 'RECITATION':
          throw new Error('İçerik telif hakkı nedeniyle engellenmiş olabilir. Lütfen farklı bir görsel deneyin.');
        case 'MAX_TOKENS':
          throw new Error('Prompt çok uzun. Lütfen daha kısa bir açıklama deneyin.');
        default:
          throw new Error(`Oluşturma durdu: ${candidate.finishReason}. Lütfen farklı bir görsel veya prompt deneyin.`);
      }
    }
    
    if (!candidate.content || !candidate.content.parts) {
      console.error("Invalid candidate structure:", candidate);
      throw new Error("API'den geçersiz yanıt yapısı. Lütfen tekrar deneyin.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        generatedImages.push(part.inlineData.data);
      }
    }

    if (generatedImages.length === 0) {
      // Check for a text response which might indicate a safety block or other issue
      const textResponse = response.text ? response.text.trim() : "";
      if (textResponse) {
        throw new Error(`Model metin yanıtı döndürdü: "${textResponse}"`);
      }
      throw new Error("Görsel oluşturulamadı. Güvenlik ayarları nedeniyle engellenmiş olabilir.");
    }
    
    return generatedImages;
  } catch (error) {
    console.error("Error generating mockup:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Mockup oluşturulurken bilinmeyen bir hata oluştu.");
  }
}

export async function suggestPromptsForImage(
  imageBase64: string,
  mimeType: string,
  promptText: string
): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A creative mockup scene description."
          }
        }
      }
    });

    // Fix: Check if response.text exists before trimming
    const jsonString = response.text ? response.text.trim() : "";
    if (!jsonString) {
      throw new Error("Received an empty response from the AI for prompt suggestions.");
    }
    const suggestions = JSON.parse(jsonString);

    if (!Array.isArray(suggestions) || !suggestions.every(s => typeof s === 'string')) {
      throw new Error("Invalid response format from AI. Expected a JSON array of strings.");
    }
    
    return suggestions;
  } catch (error) {
    console.error("Error suggesting prompts:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to suggest prompts: ${error.message}`);
    }
    throw new Error("An unknown error occurred while suggesting prompts.");
  }
}

export async function removeBackgroundWithAI(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  try {
    const prompt = "Remove the background from this image completely. Keep only the main subject/object in the foreground. Make the background fully transparent. Return only the image with transparent background, no text or explanations.";
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // Check if response has the expected structure
    if (!response.candidates || response.candidates.length === 0) {
      console.error("No candidates in response:", response);
      throw new Error("AI'dan yanıt alınamadı. İstek engellenmiş olabilir.");
    }

    const candidate = response.candidates[0];
    
    // Check for finish reason first
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.error("Background removal stopped with reason:", candidate.finishReason);
      console.error("Full candidate:", candidate);
      
      switch (candidate.finishReason) {
        case 'NO_IMAGE':
          throw new Error('Arkaplan silinemedi. Lütfen farklı bir görsel deneyin. Görselinizin net ve yüksek kaliteli olduğundan emin olun.');
        case 'SAFETY':
          throw new Error('İçerik güvenlik filtreleri tarafından engellendi. Lütfen farklı bir görsel deneyin.');
        case 'RECITATION':
          throw new Error('İçerik telif hakkı nedeniyle engellenmiş olabilir. Lütfen farklı bir görsel deneyin.');
        default:
          throw new Error(`İşlem durdu: ${candidate.finishReason}. Lütfen farklı bir görsel deneyin.`);
      }
    }
    
    if (!candidate.content || !candidate.content.parts) {
      console.error("Invalid candidate structure:", candidate);
      throw new Error("API'den geçersiz yanıt yapısı. Lütfen tekrar deneyin.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }

    // Check for a text response which might indicate a safety block or other issue
    const textResponse = response.text ? response.text.trim() : "";
    if (textResponse) {
      throw new Error(`Model metin yanıtı döndürdü: "${textResponse}"`);
    }
    throw new Error("Görsel oluşturulamadı. Güvenlik ayarları nedeniyle engellenmiş olabilir.");
  } catch (error) {
    console.error("Error removing background:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Arkaplan silinirken bilinmeyen bir hata oluştu.");
  }
}
