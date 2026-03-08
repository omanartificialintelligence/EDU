
import { GoogleGenAI, Type } from "@google/genai";

// Always use named parameter and process.env.GEMINI_API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const suggestStrategies = async (lessonTitle: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `بصفتك خبير تربوي، اقترح 5 استراتيجيات تدريس حديثة ومناسبة لدرس بعنوان "${lessonTitle}". أجب بصيغة قائمة بسيطة باللغة العربية.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    // Extracting text output from GenerateContentResponse using .text property
    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return [];
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return ["العصف الذهني", "التعلم باللعب", "خرائط المفاهيم", "الكرسي الساخن", "فكر - زاوج - شارك"];
  }
};

export const chatWithAI = async (message: string, history: {role: 'user' | 'ai', content: string}[]): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "أنت مساعد ذكي وخبير تربوي لمعلمات المجال الأول في سلطنة عمان. تجيب باللغة العربية بأسلوب احترافي وداعم، وتقدم أفكاراً إبداعية للتدريس والأنشطة الصفية.",
      },
    });

    // We need to send the history if possible, but the SDK's chat.sendMessage only takes the latest message.
    // To maintain context, we can prepend the history to the message or use the chat instance if we kept it around.
    // Since we create a new chat instance here, we'll just send the latest message with some context.
    
    let contextMessage = message;
    if (history.length > 0) {
      const historyText = history.map(h => `${h.role === 'user' ? 'المعلمة' : 'المساعد'}: ${h.content}`).join('\n');
      contextMessage = `المحادثة السابقة:\n${historyText}\n\nسؤال المعلمة الحالي: ${message}`;
    }

    const response = await chat.sendMessage({ message: contextMessage });
    return response.text || "عذراً، لم أتمكن من الرد.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.";
  }
};
