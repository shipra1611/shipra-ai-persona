import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildRAGContext, loadSystemPrompt } from '@/app/lib/rag'

export const runtime = 'nodejs'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Vapi sends webhooks for: assistant-request, function-call, end-of-call-report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message } = body

    // Handle different Vapi message types
    switch (message?.type) {
      case 'assistant-request': {
        // Vapi is asking for the assistant configuration
        return NextResponse.json({
          assistant: buildVapiAssistant()
        })
      }

      case 'function-call': {
        // Vapi calling our functions (e.g., check_availability, book_meeting)
        const { functionCall } = message
        
        if (functionCall?.name === 'check_availability') {
          return NextResponse.json({
            result: `Shipra is available weekdays. The easiest way to book is at ${process.env.CALENDLY_URL || 'your-calendly-link'}. Would you like me to walk you through booking a slot?`
          })
        }
        
        if (functionCall?.name === 'get_context') {
          const { query } = functionCall.parameters
          const context = buildRAGContext(query || '')
          const system = loadSystemPrompt()
          
          const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            system: `${system}\n\nKNOWLEDGE BASE:\n${context}\n\nRespond concisely for voice — no markdown, plain conversational sentences.`,
            messages: [{ role: 'user', content: query }]
          })
          
          return NextResponse.json({
            result: response.content[0].type === 'text' ? response.content[0].text : 'I can answer that — what specifically would you like to know?'
          })
        }

        return NextResponse.json({ result: 'Function not recognized.' })
      }

      case 'end-of-call-report': {
        // Log for eval purposes
        console.log('Call ended:', {
          duration: message.durationSeconds,
          transcript: message.transcript?.slice(0, 200),
          summary: message.summary,
        })
        return NextResponse.json({ received: true })
      }

      default:
        return NextResponse.json({ received: true })
    }
  } catch (err) {
    console.error('Vapi webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

function buildVapiAssistant() {
  return {
    name: "Shipra's AI Representative",
    voice: {
      provider: "11labs",
      voiceId: "rachel", // Change to preferred ElevenLabs voice
    },
    model: {
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      systemPrompt: buildVoiceSystemPrompt(),
      functions: [
        {
          name: "get_context",
          description: "Get information about Shipra's background, projects, or skills to answer a question",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "The question to answer about Shipra" }
            },
            required: ["query"]
          }
        },
        {
          name: "check_availability",
          description: "Check Shipra's availability and provide booking link",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      ]
    },
    firstMessage: "Hi! I'm Shipra's AI representative. Shipra is a healthcare AI researcher currently interning at BrainSightAI — she built me to handle screening calls so her application gets evaluated on substance. I can answer questions about her background, projects, and skills, and I can help you schedule an interview. What would you like to know?",
    endCallMessage: "Thanks for the call! You should receive a calendar confirmation by email. Looking forward to the conversation.",
    endCallPhrases: ["goodbye", "bye", "that's all", "thank you, bye"],
  }
}

function buildVoiceSystemPrompt(): string {
  const ragContext = buildRAGContext('general background skills projects')
  return `You are Shipra Kumari's AI representative handling a phone screening call.

RULES:
1. Speak naturally and conversationally — this is a voice call, no markdown
2. Keep answers concise (30-60 seconds per response) — voice is not text
3. Be specific with evidence from Shipra's actual work
4. If you don't know something, say "That specific detail isn't something I have — Shipra can address it directly when you meet"
5. For scheduling: offer the Calendly link or ask for their email
6. Handle interruptions gracefully — don't restart sentences from the beginning
7. If asked about availability: "Shipra is flexible on timing — she's based in India so IST timezone, but happy to accommodate your hours"
8. NEVER hallucinate metrics, papers, or credentials not in your knowledge

KNOWLEDGE:
${ragContext.slice(0, 3000)}

This call is itself a demonstration of what Shipra can build. Mention that naturally if it comes up.`
}
