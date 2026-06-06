
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

interface BookingSlot {
  label: string
  date: string
  time: string
}

interface BookingState {
  slots: BookingSlot[]
  selected: BookingSlot | null
  name: string
  email: string
  loading: boolean
  error: string
  success: boolean
}

const GITHUB_URL =
  'https://github.com/shipra1611'

const LINKEDIN_URL =
  'https://www.linkedin.com/in/shipra-pathak-401a4230b/'

const SUGGESTED = [
  'Why is Shipra the right fit for AI Engineer?',
  'Walk me through the XAI stress tester',
  'Explain the BrainSightAI internship',
  'What was the Clever Hans finding?',
  
]

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

export default function Home() {

  // ====================================================
  // CHAT
  // ====================================================

  const [messages, setMessages] =
    useState<Message[]>([
      {
        role: 'assistant',
        content: `Hi — I'm **Shipra's AI representative**.

Shipra is a healthcare AI researcher currently interning at **BrainSightAI**, working on clinical ML and medical imaging.

She's a dual-degree student at BITS Pilani Hyderabad and co-authoring a NeurIPS 2026 paper on hallucination attribution in medical VLMs.

Ask me anything about:
- AI engineering
- research
- infrastructure
- medical imaging
- systems design
- projects
- internships

You can also book a live interview call.`,
        timestamp: Date.now(),
      },
    ])

  const [input, setInput] =
    useState('')

  const [isLoading, setIsLoading] =
    useState(false)

  // ====================================================
  // VAPI
  // ====================================================

  const [
    isCallActive,
    setIsCallActive,
  ] = useState(false)

  const [
    showVoiceOverlay,
    setShowVoiceOverlay,
  ] = useState(false)

  const [callStatus, setCallStatus] =
    useState('Ready')

  const vapiRef =
    useRef<any>(null)

  // ====================================================
  // BOOKING
  // ====================================================

  const [
    showBooking,
    setShowBooking,
  ] = useState(false)

  const [booking, setBooking] =
    useState<BookingState>({
      slots: [],
      selected: null,
      name: '',
      email: '',
      loading: false,
      error: '',
      success: false,
    })

  // ====================================================
  // REFS
  // ====================================================

  const messagesEndRef =
    useRef<HTMLDivElement>(null)

  // ====================================================
  // AUTO SCROLL
  // ====================================================

  useEffect(() => {
    messagesEndRef.current
      ?.scrollIntoView({
        behavior: 'smooth',
      })
  }, [messages])

  // ====================================================
  // INIT VAPI
  // ====================================================

  useEffect(() => {

    const publicKey =
      process.env
        .NEXT_PUBLIC_VAPI_PUBLIC_KEY

    if (!publicKey) return

    import('@vapi-ai/web')
      .then(({ default: Vapi }) => {

        const vapi =
          new Vapi(publicKey)

        vapiRef.current = vapi

        vapi.on(
          'call-start',
          () => {
            setIsCallActive(true)
            setShowVoiceOverlay(true)
            setCallStatus(
              'Voice interview active'
            )
          }
        )

        vapi.on(
          'call-end',
          () => {
            setIsCallActive(false)
            setShowVoiceOverlay(false)
            setCallStatus('Ready')
          }
        )

        vapi.on(
          'speech-start',
          () => {
            setCallStatus(
              'Assistant speaking...'
            )
          }
        )

        vapi.on(
          'speech-end',
          () => {
            setCallStatus(
              'Listening...'
            )
          }
        )

        vapi.on(
          'error',
          (err: any) => {

            console.error(
              'VAPI ERROR:',
              err
            )

            setCallStatus(
              'Connection failed'
            )

            setIsCallActive(false)

            setShowVoiceOverlay(false)
          }
        )
      })

  }, [])

  // ====================================================
  // LOAD CAL.COM SLOTS
  // ====================================================

  const openBookingModal =
    async () => {

      setShowBooking(true)

      setBooking((b) => ({
        ...b,
        loading: true,
        error: '',
      }))

      try {

        const response =
          await fetch(
            '/api/book-meeting'
          )

        const data =
          await response.json()

        setBooking((b) => ({
          ...b,
          slots:
            data.rawSlots || [],
          loading: false,
        }))

      } catch {

        setBooking((b) => ({
          ...b,
          loading: false,
          error:
            'Failed to load slots.',
        }))
      }
    }

  // ====================================================
  // DETECT BOOKING INTENT
  // ====================================================

  function detectBookingIntent(
    text: string
  ) {

    return [
      'book',
      'schedule',
      'meeting',
      'call',
      'interview',
      'availability',
    ].some((word) =>
      text.toLowerCase().includes(word)
    )
  }

  // ====================================================
  // CHAT SEND
  // ====================================================

  const sendMessage =
    useCallback(
      async (
        content: string
      ) => {

        if (
          !content.trim() ||
          isLoading
        ) {
          return
        }

        if (
          detectBookingIntent(
            content
          )
        ) {

          await openBookingModal()

          setMessages((prev) => [
            ...prev,
            {
              role: 'user',
              content,
              timestamp:
                Date.now(),
            },
            {
              role: 'assistant',
              content:
                'Absolutely — please select an available slot from the booking panel.',
              timestamp:
                Date.now(),
            },
          ])

          setInput('')

          return
        }

        const latencyStart =
          Date.now()

        const userMsg: Message = {
          role: 'user',
          content,
          timestamp: Date.now(),
        }

        const updatedMessages = [
          ...messages,
          userMsg,
        ]

        setMessages(updatedMessages)

        setInput('')

        setIsLoading(true)

        try {

          const response =
            await fetch(
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

          const data =
            await response.json()

          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                data.content ||
                'No response generated.',
              timestamp:
                Date.now(),
              latencyMs:
                Date.now() -
                latencyStart,
            },
          ])

        } catch {

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

  // ====================================================
  // BOOKING CONFIRM
  // ====================================================

  const confirmBooking =
  async () => {

    if (
      !booking.selected ||
      !booking.name ||
      !booking.email
    ) {

      setBooking((b) => ({
        ...b,
        error:
          'Please fill all fields.',
      }))

      return
    }

    try {

      setBooking((b) => ({
        ...b,
        loading: true,
        error: '',
      }))

      const response =
        await fetch(
          '/api/book-meeting',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              name:
                booking.name,

              email:
                booking.email,

              date:
                booking.selected.date,

              time:
                booking.selected.time,
            }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {

        setBooking((b) => ({
          ...b,
          loading: false,
          error:
            data.error ||
            'Booking failed.',
        }))

        return
      }

      setBooking((b) => ({
        ...b,
        loading: false,
        success: true,
      }))

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            `Booking confirmed for ${booking.selected?.label}. Calendar invite sent to ${booking.email}.`,
          timestamp:
            Date.now(),
        },
      ])

    } catch {

      setBooking((b) => ({
        ...b,
        loading: false,
        error:
          'Booking failed.',
      }))
    }
  }

  // ====================================================
  // START VOICE
  // ====================================================

  const startVoiceCall =
    async () => {

      try {

        const assistantId =
          process.env
            .NEXT_PUBLIC_VAPI_ASSISTANT_ID

        if (
          !assistantId
        ) {
          alert(
            'Missing assistant ID'
          )
          return
        }

        await vapiRef.current.start(
          assistantId
        )

      } catch (err) {

        console.error(err)
      }
    }

  // ====================================================
  // STOP VOICE
  // ====================================================

  const stopVoiceCall =
    async () => {

      await vapiRef.current?.stop()
    }

  // ====================================================
  // UI
  // ====================================================

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        background:
          '#08080f',
        color:
          'rgba(255,255,255,0.92)',
        fontFamily:
          'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >

      {/* HEADER */}

      

      
<header
  style={{
    padding: '18px 32px',
    borderBottom:
      '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    minHeight: '84px',
  }}
>

  {/* LEFT */}

  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minWidth: '220px',
    }}
  >

    <div
      style={{
        fontWeight: 700,
        fontSize: '22px',
        lineHeight: 1,
      }}
    >
      Shipra Kumari
    </div>

    <div
      style={{
        fontSize: '11px',
        color:
          'rgba(255,255,255,0.45)',
        marginTop: '8px',
        letterSpacing: '0.12em',
      }}
    >
      AI REPRESENTATIVE · LIVE
    </div>

  </div>

  {/* RIGHT */}

  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
    }}
  >

    <a
      href={GITHUB_URL}
      target="_blank"
      style={{
        color:
          'rgba(255,255,255,0.65)',
        textDecoration: 'none',
        fontSize: '16px',
      }}
    >
      GitHub
    </a>

    <a
      href={LINKEDIN_URL}
      target="_blank"
      style={{
        color:
          'rgba(255,255,255,0.65)',
        textDecoration: 'none',
        fontSize: '16px',
      }}
    >
      LinkedIn
    </a>

    <button
      onClick={openBookingModal}
      style={{
        height: '56px',
        padding: '0 30px',
        borderRadius: '14px',
        border: 'none',
        background: '#00ff9d',
        color: '#08080f',
        fontWeight: 700,
        fontSize: '16px',
        cursor: 'pointer',
      }}
    >
      BOOK CALL
    </button>

    {!isCallActive ? (

      <button
        onClick={startVoiceCall}
        style={{
          height: '56px',
          padding: '0 28px',
          borderRadius: '14px',
          border:
            '1px solid rgba(255,255,255,0.12)',
          background:
            'rgba(255,255,255,0.05)',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        Start Voice Interview
      </button>

    ) : (

      <button
        onClick={stopVoiceCall}
        style={{
          height: '56px',
          padding: '0 28px',
          borderRadius: '14px',
          border: 'none',
          background: '#dc2626',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        End Interview
      </button>

    )}

  </div>

</header>



      {/* CHAT */}

      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding:
            '24px 20px 140px',
        }}
      >

        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            display: 'flex',
            flexDirection:
              'column',
            gap: '20px',
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
                    padding:
                      '16px 18px',
                    borderRadius:
                      '14px',
                    background:
                      msg.role ===
                      'user'
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,255,157,0.04)',
                    border:
                      '1px solid rgba(255,255,255,0.08)',
                    lineHeight: 1.7,
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
                    msg.content
                  )}

                </div>

              </div>
            )
          )}

          {isLoading && (

            <div
              style={{
                color:
                  'rgba(255,255,255,0.4)',
              }}
            >
              Thinking...
            </div>

          )}

          {messages.length <= 1 && (

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >

              {SUGGESTED.map(
                (q, i) => (

                  <button
                    key={i}
                    onClick={() =>
                      sendMessage(q)
                    }
                    style={{
                      padding:
                        '8px 12px',
                      borderRadius:
                        '8px',
                      border:
                        '1px solid rgba(255,255,255,0.1)',
                      background:
                        'transparent',
                      color:
                        'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                    }}
                  >
                    {q}
                  </button>
                )
              )}

            </div>

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
            '20px',
          borderTop:
            '1px solid rgba(255,255,255,0.08)',
          background:
            '#08080f',
        }}
      >

        <div
          style={{
            maxWidth: '820px',
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
            onKeyDown={(e) => {

              if (
                e.key ===
                  'Enter' &&
                !e.shiftKey
              ) {
                e.preventDefault()

                sendMessage(
                  input
                )
              }
            }}
            rows={1}
            placeholder="Ask about projects, research, AI systems..."
            style={{
              flex: 1,
              resize: 'none',
              borderRadius:
                '12px',
              border:
                '1px solid rgba(255,255,255,0.1)',
              background:
                'rgba(255,255,255,0.05)',
              padding:
                '14px 16px',
              color: 'white',
            }}
          />

          <button
            onClick={() =>
              sendMessage(input)
            }
            style={{
              padding:
                '0 24px',
              borderRadius:
                '12px',
              border: 'none',
              background:
                '#00ff9d',
              color: '#08080f',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Send
          </button>

        </div>

      </div>

      {/* BOOKING MODAL */}

      {showBooking && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,0.82)',
            backdropFilter:
              'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
            zIndex: 100,
            padding: '20px',
          }}
        >

          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              background:
                '#0f0f1a',
              borderRadius:
                '20px',
              border:
                '1px solid rgba(255,255,255,0.08)',
              padding:
                '28px',
            }}
          >

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom:
                  '24px',
              }}
            >

              <h2
                style={{
                  fontSize: '42px',
                  fontWeight: 700,
                }}
              >
                Book a Call
              </h2>

              <button
                onClick={() =>
                  setShowBooking(false)
                }
                style={{
                  background:
                    'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '32px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>

            </div>

            {booking.success ? (

              <div
                style={{
                  textAlign:
                    'center',
                  padding:
                    '40px 0',
                }}
              >

                <div
                  style={{
                    fontSize:
                      '24px',
                    color:
                      '#00ff9d',
                    fontWeight: 700,
                  }}
                >
                  Booking Confirmed
                </div>

              </div>

            ) : (

              <>
                <div
                  style={{
                    display: 'flex',
                    flexDirection:
                      'column',
                    gap: '16px',
                  }}
                >

                  {booking.loading ? (

                    <div>
                      Loading available slots...
                    </div>

                  ) : (

                    booking.slots.map(
                      (
                        slot,
                        i
                      ) => (

                        <button
                          key={i}
                          onClick={() =>
                            setBooking(
                              (
                                b
                              ) => ({
                                ...b,
                                selected:
                                  slot,
                              })
                            )
                          }
                          style={{
                            padding:
                              '24px',
                            borderRadius:
                              '16px',
                            border:
                              booking.selected ===
                              slot
                                ? '1px solid #00ff9d'
                                : '1px solid rgba(255,255,255,0.1)',
                            background:
                              booking.selected ===
                              slot
                                ? '#1ec78d'
                                : 'transparent',
                            color:
                              booking.selected ===
                              slot
                                ? '#08080f'
                                : 'white',
                            textAlign:
                              'left',
                            fontSize:
                              '18px',
                            cursor:
                              'pointer',
                          }}
                        >
                          {
                            slot.label
                          }
                        </button>
                      )
                    )
                  )}

                  <input
                    placeholder="Your Name"
                    value={
                      booking.name
                    }
                    onChange={(
                      e
                    ) =>
                      setBooking(
                        (
                          b
                        ) => ({
                          ...b,
                          name:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={{
                      padding:
                        '20px',
                      borderRadius:
                        '14px',
                      border:
                        '1px solid rgba(255,255,255,0.1)',
                      background:
                        'rgba(255,255,255,0.05)',
                      color:
                        'white',
                    }}
                  />

                  <input
                    placeholder="Your Email"
                    value={
                      booking.email
                    }
                    onChange={(
                      e
                    ) =>
                      setBooking(
                        (
                          b
                        ) => ({
                          ...b,
                          email:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={{
                      padding:
                        '20px',
                      borderRadius:
                        '14px',
                      border:
                        '1px solid rgba(255,255,255,0.1)',
                      background:
                        'rgba(255,255,255,0.05)',
                      color:
                        'white',
                    }}
                  />

                  {booking.error && (

                    <div
                      style={{
                        color:
                          '#ff6b6b',
                      }}
                    >
                      {
                        booking.error
                      }
                    </div>

                  )}

                  <button
                    onClick={
                      confirmBooking
                    }
                    style={{
                      marginTop:
                        '8px',
                      padding:
                        '24px',
                      borderRadius:
                        '16px',
                      border: 'none',
                      background:
                        '#3ad29f',
                      color:
                        '#08080f',
                      fontWeight: 700,
                      fontSize:
                        '18px',
                      cursor:
                        'pointer',
                    }}
                  >
                    Confirm Booking
                  </button>

                </div>
              </>
            )}

          </div>

        </div>

      )}

      {/* VOICE OVERLAY */}

      {showVoiceOverlay && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(8,8,15,0.92)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
            flexDirection:
              'column',
            gap: '24px',
          }}
        >

          <div
            style={{
              width: '140px',
              height: '140px',
              borderRadius:
                '50%',
              background:
                'linear-gradient(135deg,#00ff9d22,#00ff9d44)',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'center',
              fontSize: '44px',
            }}
          >
            🎤
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
            }}
          >
            Voice Interview Active
          </div>

          <div>
            {callStatus}
          </div>

        </div>

      )}

    </div>
  )
}

