
import {
  NextRequest,
  NextResponse,
} from 'next/server'

import Anthropic from '@anthropic-ai/sdk'

import {
  buildRAGContext,
  loadSystemPrompt,
} from '@/app/lib/rag'

export const runtime = 'nodejs'

const client = new Anthropic({
  apiKey:
    process.env
      .ANTHROPIC_API_KEY!,
})

const CALENDLY_URL =
  process.env
    .CALENDLY_URL ||
  'https://calendly.com/f20231038-hyderabad/new-meeting'

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json()

    console.log(
      'Vapi webhook:',
      JSON.stringify(
        body,
        null,
        2
      )
    )

    const { message } = body

    switch (
      message?.type
    ) {
      case 'assistant-request': {
        return NextResponse.json({
          assistant:
            buildVapiAssistant(),
        })
      }

      case 'function-call': {
        const functionCall =
          message.functionCall

        // OPEN SCHEDULING
        if (
          functionCall?.name ===
          'open_scheduling'
        ) {
          return NextResponse.json(
            {
              result:
                'Opening the scheduling window now. You can choose any convenient slot directly through Calendly.',

              actions: [
                {
                  type: 'open_url',

                  url: CALENDLY_URL,
                },
              ],
            }
          )
        }

        // RAG CONTEXT LOOKUP
        if (
          functionCall?.name ===
          'get_context'
        ) {
          const query =
            functionCall
              ?.parameters
              ?.query || ''

          const ragContext =
            buildRAGContext(
              query
            )

          const systemPrompt =
            loadSystemPrompt()

          const response =
            await client.messages.create(
              {
                model:
                  'claude-sonnet-4-20250514',

                max_tokens: 350,

                system: `
${systemPrompt}

KNOWLEDGE BASE:
${ragContext}

IMPORTANT:
- Respond naturally for voice
- No markdown
- No bullet points
- Keep answers concise
- Sound conversational
                `,

                messages: [
                  {
                    role:
                      'user',

                    content:
                      query,
                  },
                ],
              }
            )

          let answer = ''

          for (const block of response.content) {
            if (
              block.type ===
              'text'
            ) {
              answer +=
                block.text
            }
          }

          return NextResponse.json(
            {
              result:
                answer ||
                "I can help with that. Could you clarify what you'd like to know about Shipra?",
            }
          )
        }

        return NextResponse.json({
          result:
            'Function not recognized.',
        })
      }

      case 'end-of-call-report': {
        console.log(
          'Call ended:',
          {
            duration:
              message.durationSeconds,

            summary:
              message.summary,

            transcript:
              message.transcript?.slice(
                0,
                500
              ),
          }
        )

        return NextResponse.json({
          received: true,
        })
      }

      default: {
        return NextResponse.json({
          received: true,
        })
      }
    }
  } catch (error) {
    console.error(
      'Voice webhook error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Webhook processing failed.',
      },
      {
        status: 500,
      }
    )
  }
}

function buildVapiAssistant() {
  return {
    name:
      "Shipra Recruiting Assistant",

    firstMessage:
      "Hi, I'm Shipra Pathak's AI recruiting representative. Shipra is an AI systems engineer focused on healthcare AI, observability tooling, and reliable AI infrastructure. She built this voice system herself as part of her engineering work. I can discuss her projects, technical background, and help schedule a conversation. What would you like to know?",

    endCallMessage:
      "Great speaking with you. You can use Shipra's scheduling link to book a convenient time to connect further.",

    endCallPhrases: [
      'goodbye',
      'bye',
      "that's all",
      'thank you bye',
      'take care',
    ],

    silenceTimeoutSeconds: 20,

    maxDurationSeconds: 1200,

    backgroundSound: 'off',

    backchannelingEnabled: true,

    backgroundDenoisingEnabled: true,

    startSpeakingPlan: {
      waitSeconds: 0.3,

      smartEndpointingEnabled: true,
    },

    stopSpeakingPlan: {
      numWords: 3,

      voiceSeconds: 0.2,

      backoffSeconds: 1,
    },

    voice: {
      provider: '11labs',

      voiceId:
        '21m00Tcm4TlvDq8ikWAM',

      stability: 0.45,

      similarityBoost: 0.8,

      useSpeakerBoost: true,
    },

    model: {
      provider:
        'anthropic',

      model:
        'claude-sonnet-4-20250514',

      temperature: 0.5,

      maxTokens: 400,

      systemPrompt:
        buildVoiceSystemPrompt(),

      functions: [
        {
          name:
            'get_context',

          description:
            "Retrieve grounded information about Shipra's projects, background, research, or engineering work.",

          parameters: {
            type: 'object',

            properties: {
              query: {
                type: 'string',

                description:
                  'Question about Shipra',
              },
            },

            required: ['query'],
          },
        },

        {
          name:
            'open_scheduling',

          description:
            'Open the Calendly scheduling flow when the caller wants to schedule an interview or meeting.',

          parameters: {
            type: 'object',

            properties: {
              intent: {
                type: 'string',

                description:
                  'Scheduling intent',
              },
            },
          },
        },
      ],
    },
  }
}

function buildVoiceSystemPrompt() {
  const ragContext =
    buildRAGContext(
      'general background projects skills experience'
    )

  return `
You are Shipra Pathak's AI recruiting representative.

You are speaking with:
- recruiters
- engineering managers
- startup founders
- AI researchers
- hiring teams

Your purpose is to represent Shipra as:
- technically strong
- highly ambitious
- systems-oriented
- practical
- thoughtful
- fast-learning
- production-minded

IMPORTANT RULES:
- Keep answers concise for voice
- Speak naturally and conversationally
- Never sound robotic
- Avoid long monologues
- Never hallucinate credentials or experience
- If you do not know something, say so honestly
- Never claim a meeting has been booked unless confirmed externally
- Direct users to Calendly for scheduling
- Handle interruptions naturally

BACKGROUND KNOWLEDGE:
${ragContext.slice(0, 4000)}

This voice system itself was designed and engineered by Shipra as part of her AI systems work.
`
}

