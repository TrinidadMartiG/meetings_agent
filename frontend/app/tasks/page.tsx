import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { Metadata } from "next"
import { authOptions } from "@/lib/auth"
import { api } from "@/lib/api"
import { NavBar } from "@/components/NavBar"
import { TaskBoard } from "@/components/TaskBoard"

export const metadata: Metadata = {
  title: "Tareas",
}

export default async function TasksPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const token = session.backendToken ?? ""

  const [tasks, clients, meetings] = await Promise.all([
    api.getTasks(token).catch(() => []),
    api.getClients(token).catch(() => []),
    api.getMeetings(token).catch(() => []),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tablero de tareas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona tus tareas y genera un resumen semanal con IA
          </p>
        </div>

        <TaskBoard initialTasks={tasks} token={token} clients={clients} meetings={meetings} />
      </main>
    </div>
  )
}
