import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIParsedTransaction } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-2.5-flash-lite";

const transactionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isTransaction: { type: Type.BOOLEAN, description: "Set to false if the input is NOT a financial transaction (e.g. random talk, facts about age)." },
    amount: { type: Type.NUMBER, description: "The monetary value." },
    description: { type: Type.STRING, description: "Short title." },
    category: { type: Type.STRING, description: "Must be one of the provided allowed categories." },
    type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
    date: { type: Type.STRING, description: "ISO date string (YYYY-MM-DD)." }
  },
  required: ["isTransaction"]
};

export const parseTransactionFromText = async (text: string, availableCategories: string[]): Promise<AIParsedTransaction> => {
  const currentDate = new Date().toISOString().split('T')[0];
  const categoriesStr = availableCategories.join(", ");
  
  const prompt = `
    Analyze the Portuguese text. Today is ${currentDate}.
    
    1. STRICTLY determine if this is a financial transaction (spending or receiving money).
       - "I am 5 years old" -> isTransaction: false
       - "I like blue" -> isTransaction: false
       - "Bought a hotdog for $5" -> isTransaction: true
    
    2. If isTransaction is TRUE:
       - Extract amount, description, type, and date.
       - CATEGORY MATCHING: You MUST categorize it into one of these specific categories: [${categoriesStr}].
       - If the exact category doesn't exist, map it to the closest one.
       - Example: If user says "Hotel" and categories are [Food, Transport, Leisure], map to "Leisure". Do NOT create "Lodging".
    
    Input: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
        temperature: 0.1
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText) as AIParsedTransaction;
  } catch (error) {
    console.error("Gemini Text Error:", error);
    throw error;
  }
};

export const parseTransactionFromAudio = async (base64Audio: string, mimeType: string, availableCategories: string[]): Promise<AIParsedTransaction> => {
  const currentDate = new Date().toISOString().split('T')[0];
  const categoriesStr = availableCategories.join(", ");
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Audio } },
          {
            text: `Listen to this Portuguese audio. Today: ${currentDate}.
            Allowed Categories: [${categoriesStr}].
            
            Task:
            1. Is it a transaction? If no, return { isTransaction: false }.
            2. If yes, extract details. Map item to closest Allowed Category. Do NOT invent new categories.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
        temperature: 0.1
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    return JSON.parse(jsonText) as AIParsedTransaction;
  } catch (error) {
    console.error("Gemini Audio Error:", error);
    throw error;
  }
};