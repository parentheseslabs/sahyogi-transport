import axios from "axios"
import OpenAI from "openai"
import dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface EnquiryExtraction {
  customerName: string;
  customerPhoneNumber: string;
  from: string;
  to: string;
  cargoType: string;
  cargoWeight?: number;
  remarks?: string;
}

// In-memory storage for active conversations
const activeConversations = new Map<string, string[]>();

export async function transcribeAudioURL(url: string) {
  try {
    // Download the audio file as buffer
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const audioBuffer = Buffer.from(response.data)
    
    // Create a File-like object from the buffer
    const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' })
    
    // Transcribe the audio using OpenAI (forced to English)
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en", // Force transcription to English
    })
    
    // console.log('Audio transcription:', transcription.text)
    
    return transcription.text
  } catch (error) {
    console.error('Error transcribing audio:', error)
    throw error
  }
}

export function addMessageToConversation(phoneNumber: string, message: string) {
  if (!activeConversations.has(phoneNumber)) {
    activeConversations.set(phoneNumber, []);
  }
  activeConversations.get(phoneNumber)!.push(message);
}

export function getConversation(phoneNumber: string): string[] {
  return activeConversations.get(phoneNumber) || [];
}

export function clearConversation(phoneNumber: string) {
  activeConversations.delete(phoneNumber);
}

export async function extractEnquiryFromConversation(senderWhatsAppNumber: string, messages: string[]): Promise<EnquiryExtraction> {
  const conversationText = messages.join('\n');
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that extracts transport enquiry information from WhatsApp conversations. 
          Extract the following information from the conversation:
          - Customer name (the person requesting transport)
          - Customer phone number (extract from conversation, NOT the WhatsApp sender number)
          - From location (pickup/origin)
          - To location (destination)
          - Cargo type (what goods to transport)
          - Cargo weight in metric tonnes (if mentioned, convert to MT)
          - Any additional remarks or requirements
          
          IMPORTANT: Extract the actual customer's phone number from the conversation content, not the WhatsApp sender number.
          If no phone number is mentioned in conversation, leave it as empty string.
          If any other information is not clearly mentioned, leave it as null or empty string.`
        },
        {
          role: "user",
          content: `WhatsApp Sender: ${senderWhatsAppNumber}\nConversation:\n${conversationText}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "enquiry_extraction",
          schema: {
            type: "object",
            properties: {
              customerName: {
                type: "string",
                description: "Customer's name if mentioned"
              },
              customerPhoneNumber: {
                type: "string",
                description: "Customer's phone number extracted from conversation"
              },
              from: {
                type: "string",
                description: "Origin/pickup location"
              },
              to: {
                type: "string",
                description: "Destination location"
              },
              cargoType: {
                type: "string",
                description: "Type of cargo/goods to transport"
              },
              cargoWeight: {
                type: ["number", "null"],
                description: "Weight of cargo in metric tonnes"
              },
              remarks: {
                type: ["string", "null"],
                description: "Additional remarks or requirements"
              }
            },
            required: ["customerName", "customerPhoneNumber", "from", "to", "cargoType"]
          }
        }
      }
    });

    const extractedData = JSON.parse(completion.choices[0].message.content!) as EnquiryExtraction;
    
    return extractedData;
  } catch (error) {
    console.error('Error extracting enquiry from conversation:', error);
    throw error;
  }
}