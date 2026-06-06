
import { google } from "googleapis"

const calendar = google.calendar("v3")

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",

  scopes: [
    "https://www.googleapis.com/auth/calendar",
  ],
})

export async function createMeeting(
  email: string,
  startTime: string,
  endTime: string
) {

  try {

    const authClient =
      await auth.getClient()

  google.options({
  auth: authClient as any,
})

    const event = {

      summary:
        "Interview with Shipra Pathak",

      description:
        "Scheduled via Shipra AI Assistant",

      start: {
        dateTime: startTime,
        timeZone: "Asia/Kolkata",
      },

      end: {
        dateTime: endTime,
        timeZone: "Asia/Kolkata",
      },

      attendees: [
        {
          email,
        },
      ],

      conferenceData: {
        createRequest: {
          requestId:
            Date.now().toString(),

          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    }

    const response =
      await calendar.events.insert({

        calendarId:
          process.env.GOOGLE_CALENDAR_ID,

        requestBody: event,

        conferenceDataVersion: 1,

        sendUpdates: "all",
      })

    console.log(
      "GOOGLE EVENT CREATED:",
      response.data
    )

    return {
      success: true,

      hangoutLink:
        response.data.hangoutLink || "",

      eventId:
        response.data.id || "",
    }

  } catch (error) {

    console.error(
      "GOOGLE CALENDAR ERROR:",
      error
    )

    return {
      success: false,

      hangoutLink: "",

      eventId: "",
    }
  }
}

