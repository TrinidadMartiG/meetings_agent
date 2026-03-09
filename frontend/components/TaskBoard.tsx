"use client"

import { useState } from "react"
import { format, parseISO, isPast } from "date-fns"
import { es } from "date-fns/locale"
import type { Task, Client } from "@/lib/api"
import { api } from "@/lib/api"

interface TaskBoardProps {
  initialTasks: Task[]
  token: string
  clients: Client[]
}

function TaskCard({
  task,
  clientName,
  onToggle,
  onDelete,
}: {
  task: Task
  clientName?: string
  onToggle: () => void
  onDelete: () => void
}) {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try {
      await onToggle()
    } finally {
      setToggling(false)
    }
  }

  const isOverdue =
    task.status === "pending" &&
    task.due_date &&
    isPast(parseISO(task.due_date))

  const formattedDue = task.due_date
    ? (() => {
        try {
          return format(parseISO(task.due_date), "d MMM yyyy", { locale: es })
        } catch {
          return task.due_date
        }
      })()
    : null

  return (
    <div
      className={`bg-white rounded-xl border p-4 space-y-2.5 ${
        task.status === "done"
          ? "border-gray-100 opacity-75"
          : isOverdue
          ? "border-red-200"
          : "border-gray-200"
      }`}
    >
      <p
        className={`text-sm leading-relaxed ${
          task.status === "done" ? "line-through text-gray-400" : "text-gray-800"
        }`}
      >
        {task.description}
      </p>

      <div className="flex items-center gap-3 flex-wrap">
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
        {formattedDue && (
          <span
            className={`flex items-center gap-1 text-xs ${
              isOverdue ? "text-red-600 font-medium" : "text-gray-500"
            }`}
          >
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
            {isOverdue ? "Vencida: " : ""}{formattedDue}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
            task.status === "done"
              ? "bg-gray-100 hover:bg-gray-200 text-gray-600"
              : "bg-green-50 hover:bg-green-100 text-green-700"
          }`}
        >
          {toggling ? (
            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : task.status === "done" ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reabrir
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Completar
            </>
          )}
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Eliminar tarea"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

interface NewTaskFormProps {
  token: string
  clients: Client[]
  onCreated: (task: Task) => void
  onCancel: () => void
}

function NewTaskForm({ token, clients, onCreated, onCancel }: NewTaskFormProps) {
  const [description, setDescription] = useState("")
  const [clientId, setClientId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true)
    setError(null)
    try {
      const task = await api.createTask(token, {
        description: description.trim(),
        client_id: clientId || undefined,
        due_date: dueDate || undefined,
      })
      onCreated(task)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la tarea")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripcion de la tarea..."
        rows={2}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        autoFocus
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Sin cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !description.trim()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Crear tarea"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function TaskBoard({ initialTasks, token, clients }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [showNewForm, setShowNewForm] = useState(false)
  const [digest, setDigest] = useState<string[] | null>(null)
  const [loadingDigest, setLoadingDigest] = useState(false)
  const [digestError, setDigestError] = useState<string | null>(null)

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]))

  const pending = tasks.filter((t) => t.status === "pending")
  const done = tasks.filter((t) => t.status === "done")

  const handleToggle = async (task: Task) => {
    const newStatus = task.status === "pending" ? "done" : "pending"
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    )
    try {
      await api.updateTask(token, task.id, { status: newStatus })
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      )
    }
  }

  const handleDelete = async (taskId: string) => {
    const original = tasks.find((t) => t.id === taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    try {
      await api.deleteTask(token, taskId)
    } catch {
      if (original) setTasks((prev) => [...prev, original])
    }
  }

  const handleCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev])
    setShowNewForm(false)
  }

  const handleDigest = async () => {
    setLoadingDigest(true)
    setDigestError(null)
    try {
      const items = await api.getWeeklyDigest(token)
      setDigest(items)
    } catch (err) {
      setDigestError(err instanceof Error ? err.message : "Error al generar digest")
    } finally {
      setLoadingDigest(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva tarea
          </button>
        </div>
        <button
          onClick={handleDigest}
          disabled={loadingDigest}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loadingDigest ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
          Digest semanal
        </button>
      </div>

      {/* New task form */}
      {showNewForm && (
        <NewTaskForm
          token={token}
          clients={clients}
          onCreated={handleCreated}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {/* Weekly digest */}
      {digest && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-purple-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Digest semanal generado por IA
            </h3>
            <button
              onClick={() => setDigest(null)}
              className="text-purple-400 hover:text-purple-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ul className="space-y-2">
            {digest.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-purple-800">
                <span className="mt-0.5 w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-semibold text-purple-700 shrink-0">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
          {digestError && (
            <p className="mt-2 text-sm text-red-600">{digestError}</p>
          )}
        </div>
      )}

      {/* Two-column board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-gray-900">Pendientes</h3>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          </div>
          <div className="space-y-3">
            {pending.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400">No hay tareas pendientes</p>
              </div>
            ) : (
              pending.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  clientName={task.client_id ? clientMap[task.client_id] : undefined}
                  onToggle={() => handleToggle(task)}
                  onDelete={() => handleDelete(task.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Done column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-gray-900">Completadas</h3>
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {done.length}
            </span>
          </div>
          <div className="space-y-3">
            {done.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400">Aun no hay tareas completadas</p>
              </div>
            ) : (
              done.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  clientName={task.client_id ? clientMap[task.client_id] : undefined}
                  onToggle={() => handleToggle(task)}
                  onDelete={() => handleDelete(task.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
