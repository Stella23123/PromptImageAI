import { GoogleGenAI, Type } from "@google/genai";
import { PromptDetails, GuidanceLevel, AppStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const TEXT_MODEL = "gemini-3.1-pro-preview";
const IMAGE_MODEL = "gemini-2.5-flash-image";

export async function refinePrompt(
  input: string,
  guidanceLevel: GuidanceLevel,
  currentStyle: AppStyle | null,
  isStructured: boolean = false
): Promise<{ refinedPrompt: string; structured?: PromptDetails }> {
  const styleContext = currentStyle 
    ? `Apply this style context: ${currentStyle.description}. ${currentStyle.details ? JSON.stringify(currentStyle.details) : ''}`
    : "No specific style context.";

  const guidanceInstructions = {
    'minimal': "Follow the user's input strictly. Only improve clarity and English translation if needed.",
    'guided': "Suggest improvements and add relevant visual details while keeping the original intent.",
    'highly-guided': "Act as a creative director. Proactively enhance the scene with vivid, professional-grade visual descriptors."
  };

  const systemInstruction = `
    You are an AI Image Prompt Architect. Your task is to refine user inputs into high-quality, vivid, model-agnostic image generation prompts in English.
    
    GUIDANCE MODE: ${guidanceLevel}
    ${guidanceInstructions[guidanceLevel]}
    
    STYLE CONTEXT:
    ${styleContext}
    
    RULES:
    1. ALWAYS output the final prompt in English.
    2. Be visually concrete. Include subject, action, setting, style, lighting, composition, mood, and color palette.
    3. Keep it concise but descriptive.
    4. If the user provides a simple idea, expand it. If they provide a prompt, refine it.
    
    ${isStructured ? "Also provide a structured breakdown of the prompt." : ""}
  `;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: input,
    config: {
      systemInstruction,
      responseMimeType: isStructured ? "application/json" : "text/plain",
      ...(isStructured ? {
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinedPrompt: { type: Type.STRING, description: "The full refined English prompt." },
            structured: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                action: { type: Type.STRING },
                setting: { type: Type.STRING },
                style: { type: Type.STRING },
                lighting: { type: Type.STRING },
                composition: { type: Type.STRING },
                mood: { type: Type.STRING },
                colorPalette: { type: Type.STRING },
              },
              required: ["subject", "action", "setting", "style", "lighting", "composition", "mood", "colorPalette"]
            }
          },
          required: ["refinedPrompt", "structured"]
        }
      } : {})
    }
  });

  if (isStructured) {
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return { refinedPrompt: response.text || "" };
    }
  }

  return { refinedPrompt: response.text || "" };
}

export async function generateImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated");
}

export async function analyzeStyle(base64Image: string): Promise<AppStyle> {
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/png" } },
        { text: "Analyze this image's style, color palette, character design, and composition. Provide a name and a concise description for this style. Also provide a structured breakdown of these visual elements." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          details: {
            type: Type.OBJECT,
            properties: {
              style: { type: Type.STRING },
              lighting: { type: Type.STRING },
              composition: { type: Type.STRING },
              mood: { type: Type.STRING },
              colorPalette: { type: Type.STRING },
            }
          }
        },
        required: ["name", "description", "details"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  return {
    id: Math.random().toString(36).substring(7),
    name: result.name,
    description: result.description,
    referenceImage: base64Image,
    details: result.details
  };
}
