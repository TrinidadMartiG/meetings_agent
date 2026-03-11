import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { Metadata } from "next"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { authOptions } from "@/lib/auth"
import { api } from "@/lib/api"
import { NavBar } from "@/components/NavBar"
import { InsightPanel } from "@/components/InsightPanel"
import { ProcessButton } from "./ProcessButton"
import { AssignClientButton } from "./AssignClientButton"
import { DeleteMeetingButton } from "./DeleteMeetingButton"

interface PageProps {
  params: { id: string }
  searchParams: { new?: string }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  return {
    title: `Reunion ${params.id}`,
  }
}

export default async function MeetingDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const token = session.backendToken ?? ""

  const [meeting, clients] = await Promise.all([
    api.getMeeting(token, params.id).catch(() => null),
    api.getClients(token).catch(() => []),
  ])

  if (!meeting) notFound()

  const insights = meeting.processed
    ? await api
        .getInsights(token, { meetingId: meeting.id })
        .catch(() => [])
    : []

  const clientName = meeting.client_id
    ? clients.find((c) => c.id === meeting.client_id)?.name
    : undefined

  const formattedDate = (() => {
    try {
      return format(parseISO(meeting.meeting_date), "EEEE d 'de' MMMM, yyyy", {
        locale: es,
      })
    } catch {
      return meeting.meeting_date
    }
  })()

  const isNewMeeting = searchParams.new === "true"

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/meetings" className="hover:text-blue-600 transition-colors">
            Reuniones
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium truncate max-w-xs">
            {meeting.title}
          </span>
        </div>

        {/* New meeting banner */}
        {isNewMeeting && !meeting.processed && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-500 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Reunion guardada correctamente
              </p>
              <p className="text-sm text-blue-600 mt-0.5">
                Ahora puedes procesar la transcripcion con IA para extraer insights automaticamente.
              </p>
            </div>
          </div>
        )}

        {/* Meeting header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <svg
                    className="w-4 h-4 text-gray-400"
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
                  <span className="capitalize">{formattedDate}</span>
                </span>
                {clientName ? (
                  <Link
                    href={`/clients?highlight=${meeting.client_id}`}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                    </svg>
                    {clientName}
                  </Link>
                ) : (
                  <AssignClientButton
                    meetingId={meeting.id}
                    token={token}
                    clients={clients}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  meeting.processed
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    meeting.processed ? "bg-green-500" : "bg-yellow-500"
                  }`}
                />
                {meeting.processed ? "Procesado" : "Sin procesar"}
              </span>

              {!meeting.processed && (
                <ProcessButton meetingId={meeting.id} token={token} />
              )}

              <DeleteMeetingButton meetingId={meeting.id} />
            </div>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transcription panel */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Transcripcion</h2>
              <span className="text-xs text-gray-400">
                {meeting.transcription_text.length.toLocaleString()} caracteres
              </span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-thin">
              <pre className="px-6 py-5 text-sm text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">
                {meeting.transcription_text}
              </pre>
            </div>
          </div>

          {/* Insights panel */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Insights de IA</h2>
              {meeting.processed && insights.length > 0 && (
                <span className="text-xs text-gray-400">
                  {insights.length} insight{insights.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto max-h-[600px] p-6 scrollbar-thin">
              <InsightPanel
                insights={insights}
                isProcessed={meeting.processed}
                onProcessClick={undefined}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
