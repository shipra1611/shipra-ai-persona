
// app/lib/calendar.ts

import { google } from "googleapis"

import serviceAccount
from "../../service-account.json"

const auth =
  new google.auth.GoogleAuth({

    credentials: serviceAccount,

    scopes: [
      "https://www.googleapis.com/auth/calendar",
    ],
  })

export async function createMeeting(
  attendeeEmail: string,
  startISO: string,
  endISO: string
) {

  const calendar =
    google.calendar({
      version: "v3",
      auth,
    })

  const event = {

    summary:
      "Interview with Shipra Pathak",

    description:
      "Scheduled by Shipra AI Assistant",

    start: {
      dateTime: startISO,
      timeZone: "Asia/Kolkata",
    },

    end: {
      dateTime: endISO,
      timeZone: "Asia/Kolkata",
    },

    attendees: [
      {
        email: attendeeEmail,
      },
    ],

    conferenceData: {
      createRequest: {
        requestId:
          `shipra-${Date.now()}`,
      },
    },
  }

  const response =
    await calendar.events.insert({

      calendarId: "https://calendar.google.com/calendar/embed?src=pathakshipra7%40gmail.com&ctz=Asia%2FKolkata",

      requestBody: event,

      conferenceDataVersion: 1,

      sendUpdates: "all",
    })

console.log(
  "EVENT CREATED:",
  response.data
)

return {
  success: true,

  hangoutLink:
    response.data.hangoutLink || "",

  eventId:
    response.data.id,
}


}

