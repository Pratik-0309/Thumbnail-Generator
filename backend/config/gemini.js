import {GoogleGenAI} from '@google/genai'

const geminiAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
})

export default geminiAI;