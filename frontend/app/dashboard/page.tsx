import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { Metadata } from "next"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { authOptions } from "@/lib/auth"
import { api } from "@/lib/api"
import { NavBar } from "@/components/NavBar"
import { MeetingCard } from "@/components/MeetingCard"
import type { Task } from "@/lib/api"

export const metadata: Metadata = {
  title: "Inicio",
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function PendingTaskRow({ task, clientName }: { task: Task; clientName?: string }) {
  const formattedDue = task.due_date
    ? (() => {
        try {
          return format(parseISO(task.due_date), "d MMM", { locale: es })
        } catch {
          return task.due_date
        }
      })()
    : null

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-snug">{task.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {clientName && (
            <span className="text-xs text-gray-400">{clientName}</span>
          )}
          {formattedDue && (
            <span className="text-xs text-gray-400">{formattedDue}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const token = session.backendToken ?? ""

  const [meetings, tasks, clients] = await Promise.all([
    api.getMeetings(token).catch(() => []),
    api.getTasks(token, { status: "pending" }).catch(() => []),
    api.getClients(token).catch(() => []),
  ])

  const recentMeetings = [...meetings]
    .sort(
      (a, b) =>
        new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
    )
    .slice(0, 5)

  const topTasks = tasks.slice(0, 5)

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]))

  const firstName = session.user?.name?.split(" ")[0] ?? "KAM"

  const today = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {firstName}
          </h1>
          <p className="text-gray-500 mt-1 capitalize">{today}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Reuniones totales"
            value={meetings.length}
            color="bg-blue-50"
            icon={
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
          />
          <StatCard
            label="Tareas pendientes"
            value={tasks.length}
            color="bg-yellow-50"
            icon={
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            }
          />
          <StatCard
            label="Clientes activos"
            value={clients.length}
            color="bg-green-50"
            icon={
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
          />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent meetings — 2/3 width */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Reuniones recientes
              </h2>
              <Link
                href="/meetings"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todas
              </Link>
            </div>

            {recentMeetings.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
                <svg
                  className="w-10 h-10 text-gray-300 mx-auto mb-3"
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
                <p className="text-gray-400 text-sm mb-3">
                  Aun no tienes reuniones cargadas
                </p>
                <Link
                  href="/meetings/new"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Importar reunion
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    clientName={
                      meeting.client_id
                        ? clientMap[meeting.client_id]
                        : undefined
                    }
                  />
                ))}
                <Link
                  href="/meetings/new"
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Importar nueva reunion
                </Link>
              </div>
            )}
          </div>

          {/* Pending tasks — 1/3 width */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Tareas pendientes
              </h2>
              <Link
                href="/tasks"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todas
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              {topTasks.length === 0 ? (
                <div className="text-center py-6">
                  <svg
                    className="w-10 h-10 text-gray-300 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <p className="text-sm text-gray-400">
                    Sin tareas pendientes
                  </p>
                </div>
              ) : (
                <div>
                  {topTasks.map((task) => (
                    <PendingTaskRow
                      key={task.id}
                      task={task}
                      clientName={
                        task.client_id
                          ? clientMap[task.client_id]
                          : undefined
                      }
                    />
                  ))}
                  {tasks.length > 5 && (
                    <Link
                      href="/tasks"
                      className="block mt-3 text-xs text-center text-blue-600 hover:text-blue-700"
                    >
                      +{tasks.length - 5} tareas mas
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
