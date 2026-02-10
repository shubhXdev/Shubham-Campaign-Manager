import { GoogleGenAI } from "@google/genai";
import { CampaignResponse } from '../types';

export const analyzeCampaignData = async (responses: CampaignResponse[]): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "API Key is missing. Please configure your environment.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Prepare the data for the model
    const textData = responses.map(r => `- ${r.timestamp.split('T')[0]}: ${r.message} (${r.sentiment})`).join('\n');
    
    // Truncate if too long to avoid token limits in this demo
    const truncatedData = textData.length > 20000 ? textData.substring(0, 20000) + "...(truncated)" : textData;

    const prompt = `
      You are the Campaign Manager for 'Shubham Campaign'. 
      Analyze the following participant responses and provide a concise executive summary.
      
      Focus on:
      1. Overall Sentiment trends.
      2. Key themes or recurring issues (positive or negative).
      3. Actionable recommendations for Shubham.

      Keep the response professional, structured (use Markdown), and under 300 words.

      Data:
      ${truncatedData}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "An error occurred while analyzing the data. Please try again.";
  }
};