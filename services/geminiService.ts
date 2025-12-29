
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { decode } from "base64-arraybuffer";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export async function getTeacherResponse(
  prompt: string, 
  systemInstruction: string,
  model: string = "gemini-3-flash-preview"
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction,
      temperature: 0.8,
    },
  });
  return response.text || "I'm sorry, can you say that again? 🍎";
}

export async function generateSpeech(text: string): Promise<Uint8Array | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return new Uint8Array(decode(base64Audio));
    }
    return null;
  } catch (error) {
    console.error("Speech generation error:", error);
    return null;
  }
}

export async function playAudioBuffer(data: Uint8Array): Promise<void> {
  return new Promise((resolve) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const numChannels = 1;
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = audioCtx.createBuffer(numChannels, frameCount, 24000);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.onended = () => {
      resolve();
    };
    source.start();
  });
}
