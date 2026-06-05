
'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'

import { marked } from 'marked'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  latencyMs?: number
}

const SUGGESTED_QUESTIONS = [
  'Tell me about LakePulse AI',
  'What engineering tradeoffs came up?',
  'How does Shipra debug AI systems?',
  'What was the Clever Hans finding?',
  'Book an interview call',
]

const CALENDLY_URL =
  process.env
    .NEXT_PUBLIC_CALENDLY_URL ||
  'https://calendly.com/your-link'

const GITHUB_URL =
  'https://github.com/shipra1611'

const LINKEDIN_URL =
  'https://www.linkedin.com/in/shipra-pathak-401a4230b/'



function renderMarkdown(
  text: string
): string {
  try {
    return marked.parse(text, {
      breaks: true,
      gfm: true,
    }) as string
  } catch {
    return text
  }
}

function TypingIndicator() {
  return (
    <div
      style={{
        color: '#64748b',
        fontSize: '14px',
        paddingLeft: '4px',
      }}
    >
      Thinking...
    </div>
  )
}

export default function Home() {
  const [messages, setMessages] =
    useState<Message[]>([
      {
        role: 'assistant',
        content: `Heya, I'm Shipra Pathak's AI Engineering Assistant.

I can answer questions about:
- AI systems
- infrastructure projects
- research workflows
- debugging approaches
- engineering tradeoffs
- deployment decisions
- internships and experience

I'm grounded on Shipra's real resume and GitHub repositories.`,
        timestamp: Date.now(),
      },
    ])

  const [input, setInput] =
    useState('')

  const [isLoading, setIsLoading] =
    useState(false)

  const [
    showCalendly,
    setShowCalendly,
  ] = useState(false)

  const messagesEndRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: 'smooth',
      }
    )
  }, [messages])

  const detectBookingIntent = (
    text: string
  ) => {
    const bookingWords = [
      'book',
      'schedule',
      'meeting',
      'call',
      'interview',
      'availability',
    ]

    return bookingWords.some((w) =>
      text.toLowerCase().includes(w)
    )
  }

  const sendMessage = useCallback(
    async (content: string) => {
      if (
        !content.trim() ||
        isLoading
      )
        return

      const latencyStart =
        Date.now()

      const userMessage: Message = {
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      }

      const updatedMessages = [
        ...messages,
        userMessage,
      ]

      setMessages(updatedMessages)
      setInput('')
      setIsLoading(true)

      if (
        detectBookingIntent(content)
      ) {
        setShowCalendly(true)
      }

      try {
        const response = await fetch(
          '/api/chat',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              messages:
                updatedMessages,
            }),
          }
        )

        if (!response.ok) {
          throw new Error(
            'Request failed'
          )
        }

        const data =
          await response.json()

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              data.content ||
              'Something went wrong.',
            timestamp:
              Date.now(),
            latencyMs:
              Date.now() -
              latencyStart,
          },
        ])
      } catch (err) {
        console.error(err)

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Something went wrong. Please retry.',
            timestamp:
              Date.now(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading]
  )

  const handleKeyDown = (
    e: React.KeyboardEvent
  ) => {
    if (
      e.key === 'Enter' &&
      !e.shiftKey
    ) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        background:
          'linear-gradient(to bottom, #f8fafc, #eef2ff)',
        color: '#0f172a',
        fontFamily:
          'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter:
            'blur(10px)',
          background:
            'rgba(255,255,255,0.75)',
          borderBottom:
            '1px solid rgba(226,232,240,0.8)',
        }}
      >
        <div
          style={{
            maxWidth: '1150px',
            margin: '0 auto',
            padding:
              '18px 24px',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
          }}
        >
          {/* LEFT */}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: '18px',
                letterSpacing:
                  '-0.02em',
              }}
            >
              Shipra Pathak
            </div>

            <div
              style={{
                fontSize: '13px',
                color: '#64748b',
                marginTop: '2px',
              }}
            >
              AI Systems & ML Engineering
            </div>
          </div>

          {/* RIGHT */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
            }}
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration:
                  'none',
                color: '#475569',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              GitHub
            </a>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration:
                  'none',
                color: '#475569',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              LinkedIn
            </a>

            <a
             
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration:
                  'none',
                color: '#475569',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Resume
            </a>

            <button
              onClick={() =>
                setShowCalendly(
                  true
                )
              }
              style={{
                padding:
                  '10px 16px',
                background:
                  '#0f172a',
                color: 'white',
                border: 'none',
                borderRadius:
                  '10px',
                cursor:
                  'pointer',
                fontWeight: 600,
                boxShadow:
                  '0 1px 2px rgba(0,0,0,0.08)',
              }}
            >
              Book Interview
            </button>
          </div>
        </div>
      </header>

      {/* CHAT AREA */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding:
              '40px 20px 140px',
            display: 'flex',
            flexDirection:
              'column',
            gap: '24px',
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent:
                  msg.role ===
                  'user'
                    ? 'flex-end'
                    : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  background:
                    msg.role ===
                    'user'
                      ? '#dbeafe'
                      : 'rgba(255,255,255,0.92)',
                  border:
                    '1px solid rgba(226,232,240,0.9)',
                  borderRadius:
                    '18px',
                  padding:
                    '18px 20px',
                  lineHeight: 1.75,
                  fontSize: '15px',
                  boxShadow:
                    '0 4px 12px rgba(15,23,42,0.04)',
                  backdropFilter:
                    'blur(10px)',
                }}
              >
                {msg.role ===
                'assistant' ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        renderMarkdown(
                          msg.content
                        ),
                    }}
                  />
                ) : (
                  <span>
                    {msg.content}
                  </span>
                )}

                {msg.latencyMs && (
                  <div
                    style={{
                      marginTop:
                        '10px',
                      fontSize:
                        '12px',
                      color:
                        '#94a3b8',
                    }}
                  >
                    {
                      msg.latencyMs
                    }
                    ms
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <TypingIndicator />
          )}

          <div
            ref={messagesEndRef}
          />
        </div>
      </main>

      {/* SUGGESTIONS */}
      {messages.length <= 1 && (
        <div
          style={{
            position: 'fixed',
            bottom: '95px',
            left: 0,
            right: 0,
            zIndex: 20,
          }}
        >
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              padding:
                '0 20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {SUGGESTED_QUESTIONS.map(
              (q) => (
                <button
                  key={q}
                  onClick={() =>
                    sendMessage(q)
                  }
                  style={{
                    background:
                      'rgba(255,255,255,0.92)',
                    border:
                      '1px solid rgba(203,213,225,0.8)',
                    borderRadius:
                      '999px',
                    padding:
                      '10px 14px',
                    cursor:
                      'pointer',
                    fontSize:
                      '14px',
                    color:
                      '#334155',
                    boxShadow:
                      '0 2px 6px rgba(15,23,42,0.04)',
                  }}
                >
                  {q}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* INPUT */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding:
            '20px 20px 28px',
          background:
            'linear-gradient(to top, rgba(248,250,252,0.98), rgba(248,250,252,0.7))',
          backdropFilter:
            'blur(12px)',
          borderTop:
            '1px solid rgba(226,232,240,0.8)',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            gap: '12px',
          }}
        >
          <textarea
            value={input}
            onChange={(e) =>
              setInput(
                e.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            placeholder="Ask about projects, systems, architecture, debugging, or research..."
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              border:
                '1px solid rgba(203,213,225,0.9)',
              borderRadius:
                '14px',
              padding:
                '15px 16px',
              fontSize: '15px',
              outline: 'none',
              background:
                'rgba(255,255,255,0.92)',
              color:
                '#0f172a',
              boxShadow:
                '0 4px 10px rgba(15,23,42,0.04)',
            }}
          />

          <button
            onClick={() =>
              sendMessage(input)
            }
            disabled={
              !input.trim() ||
              isLoading
            }
            style={{
              padding:
                '0 24px',
              borderRadius:
                '14px',
              border: 'none',
              background:
                '#0f172a',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow:
                '0 4px 12px rgba(15,23,42,0.08)',
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* CALENDLY */}
      {showCalendly && (
        <div
          onClick={() =>
            setShowCalendly(
              false
            )
          }
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(15,23,42,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
            padding: '20px',
            zIndex: 100,
            backdropFilter:
              'blur(6px)',
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width: '100%',
              maxWidth: '760px',
              height: '80vh',
              background:
                'white',
              borderRadius:
                '18px',
              overflow:
                'hidden',
              boxShadow:
                '0 20px 60px rgba(15,23,42,0.18)',
            }}
          >
            <iframe
              src={CALENDLY_URL}
              width="100%"
              height="100%"
            />
          </div>
        </div>
      )}
    </div>
  )
}

