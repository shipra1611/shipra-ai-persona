
// app/api/voice-webhook/route.ts

import { createMeeting } from "../../lib/calendar"

import fs from "fs"
import path from "path"

import * as chrono from "chrono-node"

import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  GoogleGenerativeAI,
} from "@google/generative-ai"

export const runtime = "nodejs"

// ======================================================
// GEMINI SETUP
// ======================================================

const genAI =
  new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY!
  )

const model =
  genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  })

// ======================================================
// LOAD KNOWLEDGE FILES
// ======================================================

const githubRepos =
  fs.readFileSync(
    path.join(
      process.cwd(),
      "data/github_repos.md"
    ),
    "utf-8"
  )

const resumeData =
  fs.readFileSync(
    path.join(
      process.cwd(),
      "data/resume.md"
    ),
    "utf-8"
  )

const systemPromptFile =
  fs.readFileSync(
    path.join(
      process.cwd(),
      "data/system_prompt.md"
    ),
    "utf-8"
  )

// ======================================================
// GEMINI ANSWERING
// ======================================================

async function askGemini(
  question: string
) {

  const prompt = `
${systemPromptFile}

================ RESUME ================
${resumeData}

================ PROJECTS ================
${githubRepos}

================ QUESTION ================
${question}

STRICT RULES:
- ONLY use information provided above
- NEVER invent internships
- NEVER invent companies
- NEVER invent metrics
- NEVER invent projects
- NEVER invent research papers
- NEVER hallucinate credentials
- If uncertain, say you do not know
- Keep responses concise
- Keep under 120 words
- Sound conversational for voice calls
`

  try {

    const result =
      await model.generateContent(
        prompt
      )

    return result.response.text()

  } catch (error) {

    console.error(
      "GEMINI ERROR:",
      error
    )

    return `
I'm sorry — I had trouble answering that properly.

But I can still help explain Shipra's projects, healthcare AI work, engineering background, or schedule a meeting.
`
  }
}

// ======================================================
// MOCK AVAILABILITY
// ======================================================

async function getAvailableSlots() {

  return `
Shipra currently has availability on:

- Monday at 5 PM IST
- Tuesday at 4 PM IST
- Wednesday at 6 PM IST

Do any of those work for you?
`
}

// ======================================================
// EMAIL NORMALIZATION
// ======================================================

function normalizeEmail(
  input: string
) {

  return input
    .replace(/ at the rate /gi, "@")
    .replace(/ at /gi, "@")
    .replace(/ dot /gi, ".")
    .replace(/\s+/g, "")
    .toLowerCase()
}

// ======================================================
// WEBHOOK
// ======================================================

export async function POST(
  req: NextRequest
) {

  try {

    const body =
      await req.json()

    const message =
      body.message

    if (!message) {

      return NextResponse.json({
        received: true,
      })
    }

    // ==================================================
    // FUNCTION CALLS
    // ==================================================

    if (
      message.type ===
      "function-call"
    ) {

      const functionName =
        message.functionCall?.name

      const params =
        message.functionCall
          ?.parameters || {}

      let result = ""

      // ================================================
      // BACKGROUND QUESTIONS
      // ================================================

      if (
        functionName ===
        "get_background_info"
      ) {

        result =
          await askGemini(
            params.query || ""
          )
      }

      // ================================================
      // CHECK AVAILABILITY
      // ================================================

      else if (
        functionName ===
        "check_availability"
      ) {

        result =
          await getAvailableSlots()
      }

      // ================================================
      // BOOK MEETING
      // ================================================

      else if (
        functionName ===
        "book_meeting"
      ) {

        const preferredTime =
          params.preferredTime

        let callerEmail =
          params.callerEmail

        if (!preferredTime) {

          return NextResponse.json({
            result:
              "Could you repeat the preferred meeting date and time?",
          })
        }

        if (!callerEmail) {

          return NextResponse.json({
            result:
              "Could you share the best email for the calendar invite?",
          })
        }

        callerEmail =
          normalizeEmail(
            callerEmail
          )

        try {

          const parsedDate =
            chrono.parseDate(
              preferredTime,
              new Date(),
              {
                forwardDate: true,
              }
            )

          if (!parsedDate) {

            return NextResponse.json({
              result:
                "I couldn't clearly understand the requested date and time. Could you repeat it?",
            })
          }

          const start =
            parsedDate

          const end =
            new Date(
              start.getTime() +
              30 * 60 * 1000
            )

          console.log(
            "BOOKING REQUEST:",
            callerEmail,
            start.toISOString()
          )

          const meeting =
            await createMeeting(
              callerEmail,
              start.toISOString(),
              end.toISOString()
            )

          console.log(
            "MEETING RESULT:",
            meeting
          )

          if (!meeting.success) {

            return NextResponse.json({
              result:
                "I was unable to create the calendar event due to a technical issue. Please try another slot.",
            })
          }

          const meetLink =
            meeting.hangoutLink || ""

          result = `
Perfect.

Your meeting with Shipra has been successfully scheduled.

A Google Calendar invite has been sent to ${callerEmail}.

${meetLink
  ? `Google Meet link: ${meetLink}`
  : ""}
`
        } catch (error) {

          console.error(
            "BOOKING ERROR:",
            error
          )

          result = `
I encountered a scheduling issue while creating the meeting.

Please try another slot.
`
        }
      }

      // ================================================
      // UNKNOWN FUNCTION
      // ================================================

      else {

        result = `
I can help explain Shipra's:

- AI systems projects
- healthcare AI work
- observability tooling
- engineering background

or help schedule a meeting.
`
      }

      return NextResponse.json({
        result,
      })
    }

    // ==================================================
    // DEFAULT RESPONSE
    // ==================================================

    return NextResponse.json({
      received: true,
    })

  } catch (error) {

    console.error(
      "WEBHOOK ERROR:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Internal server error",
      },
      {
        status: 500,
      }
    )
  }
}

