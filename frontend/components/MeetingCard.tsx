import Link from "next/link"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import type { MeetingListItem } from "@/lib/api"

interface MeetingCardProps {
  meeting: MeetingListItem
  clientName?: string
}

export function MeetingCard({ meeting, clientName }: MeetingCardProps) {
  const formattedDate = (() => {
    try {
      return format(parseISO(meeting.meeting_date), "d 'de' MMMM, yyyy", {
        locale: es,
      })
    } catch {
      return meeting.meeting_date
    }
  })()

  return (
    <Link href={`/meetings/${meeting.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
              {meeting.title}
            </h3>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {clientName && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {clientName}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {formattedDate}
              </span>
            </div>
          </div>

          <span
            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              meeting.processed
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                meeting.processed ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            {meeting.processed ? "Procesado" : "Pendiente"}
          </span>
        </div>
      </div>
    </Link>
  )
}
