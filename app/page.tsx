
'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'

import { marked } from 'marked'
import Vapi from '@vapi-ai/web'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  latencyMs?: number
}

const CALENDLY_URL =
  process.env
    .NEXT_PUBLIC_CALENDLY_URL ||
  'https://calendly.com/f20231038-hyderabad/new-meeting'

const GITHUB_URL =
  'https://github.com/shipra1611'

const LINKEDIN_URL =
  'https://linkedin.com/in/shipra-pathak'



const VAPI_PUBLIC_KEY =
  '97844602-6d09-46d6-9abe-cbfa74480028'

const VAPI_ASSISTANT_ID =
  '8e0328a2-4a00-45bb-91d2-64fae64bc0b8'

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
        content: `Hi, I'm Shipra Pathak's AI engineering assistant.

I can answer questions about:
- AI systems projects
- ML infrastructure
- research workflows
- debugging approaches
- system design tradeoffs
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

  const [
    isCallActive,
    setIsCallActive,
  ] = useState(false)

  const [callStatus, setCallStatus] =
    useState('Idle')

  const [
    showVoiceOverlay,
    setShowVoiceOverlay,
  ] = useState(false)

  const messagesEndRef =
    useRef<HTMLDivElement>(null)

  const vapiRef = useRef<any>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: 'smooth',
      }
    )
  }, [messages])

  useEffect(() => {
    vapiRef.current = new Vapi(
      VAPI_PUBLIC_KEY
    )

    vapiRef.current.on(
      'call-start',
      () => {
        setIsCallActive(true)

        setShowVoiceOverlay(true)

        setCallStatus(
          'Voice interview active'
        )
      }
    )

    vapiRef.current.on(
      'call-end',
      () => {
        setIsCallActive(false)

        setShowVoiceOverlay(false)

        setCallStatus(
          'Call ended'
        )
      }
    )

    vapiRef.current.on(
      'speech-start',
      () => {
        setCallStatus(
          'Assistant speaking...'
        )
      }
    )

    vapiRef.current.on(
      'speech-end',
      () => {
        setCallStatus(
          'Listening...'
        )
      }
    )

    return () => {
      vapiRef.current?.stop()
    }
  }, [])

  const startVoiceCall =
    async () => {
      try {
        setCallStatus(
          'Connecting...'
        )

        await vapiRef.current.start(
          VAPI_ASSISTANT_ID
        )
      } catch (err) {
        console.error(err)

        setCallStatus(
          'Connection failed'
        )
      }
    }

  const stopVoiceCall =
    async () => {
      try {
        await vapiRef.current.stop()

        setIsCallActive(false)

        setShowVoiceOverlay(false)

        setCallStatus(
          'Call ended'
        )
      } catch (err) {
        console.error(err)
      }
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
    <>
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }

          50% {
            transform: scale(1.08);
            opacity: 0.88;
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

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
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '18px',
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

              {!isCallActive ? (
                <button
                  onClick={
                    startVoiceCall
                  }
                  style={{
                    padding:
                      '10px 16px',
                    background:
                      '#ffffff',
                    color:
                      '#0f172a',
                    border:
                      '1px solid rgba(203,213,225,0.8)',
                    borderRadius:
                      '10px',
                    cursor:
                      'pointer',
                    fontWeight: 600,
                  }}
                >
                  Start Voice Interview
                </button>
              ) : (
                <button
                  onClick={
                    stopVoiceCall
                  }
                  style={{
                    padding:
                      '10px 16px',
                    background:
                      '#dc2626',
                    color:
                      'white',
                    border:
                      'none',
                    borderRadius:
                      '10px',
                    cursor:
                      'pointer',
                    fontWeight: 600,
                  }}
                >
                  End Voice Interview
                </button>
              )}

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
                }}
              >
                Book Interview
              </button>
            </div>
          </div>
        </header>

        {/* CHAT */}

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
            {messages.map(
              (msg, i) => (
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
                        {
                          msg.content
                        }
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
              )
            )}

            {isLoading && (
              <TypingIndicator />
            )}

            <div
              ref={messagesEndRef}
            />
          </div>
        </main>

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
              placeholder="Ask about projects, infrastructure, research, debugging, or engineering decisions..."
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
              }}
            >
              Send
            </button>
          </div>
        </div>

        {/* VOICE OVERLAY */}

        {showVoiceOverlay && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background:
                'rgba(15,23,42,0.82)',
              backdropFilter:
                'blur(12px)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'center',
              flexDirection:
                'column',
              gap: '28px',
            }}
          >
            <div
              style={{
                width: '130px',
                height: '130px',
                borderRadius:
                  '999px',
                background:
                  'linear-gradient(to bottom right, #2563eb, #7c3aed)',
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                color: 'white',
                fontSize: '44px',
                fontWeight: 700,
                boxShadow:
                  '0 0 60px rgba(59,130,246,0.35)',
                animation:
                  'pulse 2s infinite',
              }}
            >
              🎤
            </div>

            <div
              style={{
                color: 'white',
                fontSize: '30px',
                fontWeight: 700,
              }}
            >
              Voice Interview Active
            </div>

            <div
              style={{
                color:
                  'rgba(255,255,255,0.75)',
                fontSize: '16px',
              }}
            >
              {callStatus}
            </div>

            <button
              onClick={
                stopVoiceCall
              }
              style={{
                marginTop:
                  '10px',
                padding:
                  '14px 28px',
                borderRadius:
                  '14px',
                border: 'none',
                background:
                  '#dc2626',
                color: 'white',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              End Conversation
            </button>
          </div>
        )}

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
    </>
  )
}

