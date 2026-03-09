import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { Metadata } from "next"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { authOptions } from "@/lib/auth"
import { api } from "@/lib/api"
import { NavBar } from "@/components/NavBar"
import { ClientKnowledgeBase } from "@/components/ClientKnowledgeBase"
import { ClientExpandWrapper } from "./ClientExpandWrapper"

export const metadata: Metadata = {
  title: "Clientes",
}

interface PageProps {
  searchParams: { highlight?: string }
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const token = session.backendToken ?? ""

  const [clients, meetings] = await Promise.all([
    api.getClients(token).catch(() => []),
    api.getMeetings(token).catch(() => []),
  ])

  // Pre-fetch insights for each client in parallel
  const allInsights = await Promise.all(
    clients.map((client) =>
      api
        .getInsights(token, { clientId: client.id })
        .then((insights) => ({ clientId: client.id, insights }))
        .catch(() => ({ clientId: client.id, insights: [] }))
    )
  )

  const insightsByClient = Object.fromEntries(
    allInsights.map(({ clientId, insights }) => [clientId, insights])
  )

  const meetingsByClient = clients.reduce<Record<string, typeof meetings>>(
    (acc, client) => {
      acc[client.id] = meetings.filter((m) => m.client_id === client.id)
      return acc
    },
    {}
  )

  const highlightClientId = searchParams.highlight

  // Sort: highlight first, then by most recent meeting
  const sortedClients = [...clients].sort((a, b) => {
    if (a.id === highlightClientId) return -1
    if (b.id === highlightClientId) return 1
    const aLatest = meetingsByClient[a.id]?.[0]?.meeting_date ?? ""
    const bLatest = meetingsByClient[b.id]?.[0]?.meeting_date ?? ""
    return bLatest.localeCompare(aLatest)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Base de conocimiento por cliente
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-900">{clients.length}</span>{" "}
            cliente{clients.length !== 1 ? "s" : ""}
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Sin clientes aun
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Los clientes se crean automaticamente cuando importas una reunion
              o desde el formulario de nueva reunion.
            </p>
            <Link
              href="/meetings/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Importar primera reunion
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedClients.map((client) => {
              const clientMeetings = meetingsByClient[client.id] ?? []
              const clientInsights = insightsByClient[client.id] ?? []

              const lastMeeting = [...clientMeetings].sort(
                (a, b) =>
                  new Date(b.meeting_date).getTime() -
                  new Date(a.meeting_date).getTime()
              )[0]

              const lastMeetingDate = lastMeeting
                ? (() => {
                    try {
                      return format(
                        parseISO(lastMeeting.meeting_date),
                        "d MMM yyyy",
                        { locale: es }
                      )
                    } catch {
                      return lastMeeting.meeting_date
                    }
                  })()
                : null

              const isHighlighted = client.id === highlightClientId

              return (
                <ClientExpandWrapper
                  key={client.id}
                  defaultOpen={isHighlighted}
                  header={
                    <div className="flex items-center gap-4 w-full">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-white font-bold">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-semibold text-gray-900">
                            {client.name}
                          </h2>
                          {isHighlighted && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              Activo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-sm text-gray-500">
                            {clientMeetings.length} reunion
                            {clientMeetings.length !== 1 ? "es" : ""}
                          </span>
                          {clientInsights.length > 0 && (
                            <span className="text-sm text-gray-500">
                              {clientInsights.length} insight
                              {clientInsights.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {lastMeetingDate && (
                            <span className="text-sm text-gray-400">
                              Ultima reunion: {lastMeetingDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  }
                  content={
                    <ClientKnowledgeBase
                      client={client}
                      insights={clientInsights}
                      meetings={clientMeetings}
                    />
                  }
                />
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
