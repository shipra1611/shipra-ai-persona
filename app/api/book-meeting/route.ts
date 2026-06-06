
import { google } from "googleapis"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// ======================================================
// GOOGLE AUTH
// ======================================================

const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json",

  scopes: [
    "https://www.googleapis.com/auth/calendar",
  ],
})

// ======================================================
// FALLBACK SLOTS
// ======================================================

function generateFallbackSlots() {
  return [
    {
      label: "Mon, Jun 9 at 2:00 PM IST",
      date: "2026-06-09",
      time: "14:00",
    },

    {
      label: "Tue, Jun 10 at 4:00 PM IST",
      date: "2026-06-10",
      time: "16:00",
    },

    {
      label: "Wed, Jun 11 at 11:00 AM IST",
      date: "2026-06-11",
      time: "11:00",
    },
  ]
}

// ======================================================
// GET AVAILABLE SLOTS
// ======================================================

export async function GET(
  req: NextRequest
) {

  return NextResponse.json({
    success: true,

    rawSlots:
      generateFallbackSlots(),
  })
}

// ======================================================
// CREATE BOOKING
// ======================================================

export async function POST(
  req: NextRequest
) {

  try {

    // ==============================================
    // PARSE BODY
    // ==============================================

    const body =
      await req.json()

    console.log(
      "Incoming booking request:",
      body
    )

    const {
      name,
      email,
      date,
      time,
    } = body

    // ==============================================
    // VALIDATION
    // ==============================================

    if (
      !name ||
      !email ||
      !date ||
      !time
    ) {

      return NextResponse.json(
        {
          error:
            "Missing required fields",
        },
        {
          status: 400,
        }
      )
    }

    // ==============================================
    // CREATE START / END
    // ==============================================

    const start =
      new Date(
        `${date}T${time}:00+05:30`
      )

    const end =
      new Date(
        start.getTime() +
        30 * 60 * 1000
      )

    console.log(
      "Start:",
      start.toISOString()
    )

    console.log(
      "End:",
      end.toISOString()
    )

    // ==============================================
    // GOOGLE AUTH CLIENT
    // ==============================================

    const client =
      await auth.getClient()

    console.log(
      "Google auth success"
    )

    const calendar =
  google.calendar({
    version: "v3",
    auth: client as any,
  })

    // ==============================================
    // CALENDAR ID
    // ==============================================

    const calendarId =
      process.env
        .GOOGLE_CALENDAR_ID ||
      "primary"

    console.log(
      "Using calendar:",
      calendarId
    )

    // ==============================================
    // CREATE EVENT
    // ==============================================

    const event =
  await (calendar.events.insert as any)({

        calendarId,

        conferenceDataVersion: 1,

        sendUpdates: "all",

        requestBody: {

          summary:
            `Interview with ${name}`,

          description:
            `Booked via Shipra AI Persona`,

          start: {
            dateTime:
              start.toISOString(),

            timeZone:
              "Asia/Kolkata",
          },

          end: {
            dateTime:
              end.toISOString(),

            timeZone:
              "Asia/Kolkata",
          },

          

          conferenceData: {

            createRequest: {

              requestId:
                `shipra-${Date.now()}`,

              conferenceSolutionKey: {
                type: "hangoutsMeet",
                conferenceData: {
  createRequest: {
    requestId: `shipra-${Date.now()}`,

    conferenceSolutionKey: {
      type: "hangoutsMeet",
    },
  },
},
              },
            },
          },
        },
      })

    console.log(
      "Google Calendar event created"
    )

    console.log(
      event.data
    )

    // ==============================================
    // RESPONSE
    // ==============================================

    return NextResponse.json({

      success: true,

      bookingId:
        event.data.id,

      meetLink:
        event.data.hangoutLink ||

        event.data
          .conferenceData
          ?.entryPoints?.[0]
          ?.uri ||

        null,

      confirmationMessage:
        `Booking confirmed for ${name}. Calendar invite sent to ${email}.`,
    })

  } catch (error: any) {

    // ==============================================
    // FULL ERROR LOGGING
    // ==============================================

    console.error(
      "BOOKING ERROR:"
    )

    console.error(error)

    console.error(
      error?.response?.data
    )

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Booking failed",

        details:
          error?.response?.data ||
          null,
      },
      {
        status: 500,
      }
    )
  }
}
