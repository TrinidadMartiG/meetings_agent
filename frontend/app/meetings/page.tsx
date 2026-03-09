import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { Metadata } from "next"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { api } from "@/lib/api"
import { NavBar } from "@/components/NavBar"
import { MeetingCard } from "@/components/MeetingCard"

export const metadata: Metadata = {
  title: "Reuniones",
}

interface PageProps {
  searchParams: { client_id?: string }
}

export default async function MeetingsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const token = session.backendToken ?? ""
  const clientId = searchParams.client_id

  const [meetings, clients] = await Promise.all([
    api.getMeetings(token, clientId).catch(() => []),
    api.getClients(token).catch(() => []),
  ])

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]))

  const sortedMeetings = [...meetings].sort(
    (a, b) =>
      new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
  )

  const selectedClient = clientId ? clients.find((c) => c.id === clientId) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reuniones</h1>
            {selectedClient && (
              <p className="text-sm text-gray-500 mt-0.5">
                Filtrando por: <span className="font-medium text-gray-700">{selectedClient.name}</span>
              </p>
            )}
          </div>
          <Link
            href="/meetings/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Importar reunion
          </Link>
        </div>

        {/* Client filter chips */}
        {clients.length > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Link
              href="/meetings"
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !clientId
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              Todos
            </Link>
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/meetings?client_id=${client.id}`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  clientId === client.id
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {client.name}
              </Link>
            ))}
          </div>
        )}

        {/* Meeting list */}
        {sortedMeetings.length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {clientId ? "No hay reuniones para este cliente" : "Aun no tienes reuniones"}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Importa una transcripcion para comenzar a extraer insights con IA.
            </p>
            <Link
              href="/meetings/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Importar reunion
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                clientName={
                  meeting.client_id ? clientMap[meeting.client_id] : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Summary footer */}
        {sortedMeetings.length > 0 && (
          <p className="text-sm text-gray-400 text-center mt-6">
            {sortedMeetings.length} reunion{sortedMeetings.length !== 1 ? "es" : ""}
            {clientId ? " para este cliente" : " en total"}
          </p>
        )}
      </main>
    </div>
  )
}
