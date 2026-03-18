"use client"

import { useState } from "react"
import { format, parseISO, isPast, addDays, isAfter, isBefore } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import type { Task, Client } from "@/lib/api"
import { api } from "@/lib/api"
import { TaskCommentSection } from "@/components/TaskCommentSection"

interface WeeklyTaskSummaryProps {
  initialTasks: Task[]
  token: string
  clients: Client[]
}

function taskImportance(task: Task): number {
  if (task.due_date) {
    const diff = (new Date(task.due_date).getTime() - Date.now()) / 86400000
    if (diff <= 0) return 100
    if (diff <= 7) return 90 - diff
    return 50 - diff
  }
  return 30
}

function isThisWeek(dateStr: string): boolean {
  const date = parseISO(dateStr)
  return isAfter(date, addDays(new Date(), -1)) && isBefore(date, addDays(new Date(), 8))
}

function fmt(dateStr: string, pattern: string) {
  try { return format(parseISO(dateStr), pattern, { locale: es }) }
  catch { return dateStr }
}

// ─── Expandable task row ──────────────────────────────────────────────────────

function TaskRow({
  task,
  token,
  clientName,
  onToggle,
  onDueDateChange,
}: {
  task: Task
  token: string
  clientName?: string
  onToggle: (task: Task) => void
  onDueDateChange: (task: Task, date: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState(task.due_date ?? "")

  const isOverdue = task.due_date && task.status === "pending" && isPast(parseISO(task.due_date))

  const handleToggle = async () => {
    setToggling(true)
    try { await onToggle(task) }
    finally { setToggling(false) }
  }

  const handleSaveDate = async () => {
    if (dateValue !== task.due_date) {
      await onDueDateChange(task, dateValue)
    }
    setEditingDate(false)
  }

  return (
    <div className={`rounded-xl border transition-colors ${
      task.status === "done"
        ? "border-gray-100 bg-gray-50/50"
        : isOverdue
        ? "border-red-100 bg-red-50/30"
        : "border-gray-100 bg-white"
    }`}>
      {/* Main row */}
      <div
        className="flex items-start gap-2.5 p-3 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
          task.status === "done" ? "bg-green-400" : isOverdue ? "bg-red-400" : "bg-yellow-400"
        }`} />

        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${task.status === "done" ? "line-through text-gray-400" : "text-gray-800"}`}>
            {task.description}
          </p>

          {/* Metadata row */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {clientName && (
              <span className="text-xs text-gray-400">{clientName}</span>
            )}
            <span className="text-xs text-gray-300">
              Creada: {fmt(task.created_at, "d MMM yyyy")}
            </span>
            {task.due_date ? (
              <span className={`text-xs font-medium ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
                {isOverdue ? "⚠ Vencida: " : "Vence: "}{fmt(task.due_date, "d MMM yyyy")}
              </span>
            ) : (
              <span className="text-xs text-gray-300 italic">Sin fecha límite</span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <svg
          className={`w-4 h-4 text-gray-300 shrink-0 mt-0.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-2.5">
          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                task.status === "done"
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  : "bg-green-50 hover:bg-green-100 text-green-700"
              }`}
            >
              {toggling ? (
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : task.status === "done" ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {task.status === "done" ? "Reabrir" : "Completar"}
            </button>

            {/* Due date editor */}
            {editingDate ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
                <button
                  onClick={handleSaveDate}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => { setEditingDate(false); setDateValue(task.due_date ?? "") }}
                  className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingDate(true) }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-gray-100 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {task.due_date ? "Editar fecha" : "Añadir fecha límite"}
              </button>
            )}
          </div>

          {/* Comments */}
          <TaskCommentSection
            taskId={task.id}
            token={token}
            initialCount={task.comment_count}
          />
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeeklyTaskSummary({ initialTasks, token, clients }: WeeklyTaskSummaryProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]))

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const all = await api.getTasks(token)
      setTasks(all)
      setLastUpdated(new Date())
    } finally {
      setRefreshing(false)
    }
  }

  const handleToggle = async (task: Task) => {
    const newStatus = task.status === "pending" ? "done" : "pending"
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t))
    try {
      await api.updateTask(token, task.id, { status: newStatus })
    } catch {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t))
    }
  }

  const handleDueDateChange = async (task: Task, date: string) => {
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, due_date: date || null } : t))
    try {
      await api.updateTask(token, task.id, { due_date: date || undefined })
    } catch {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, due_date: task.due_date } : t))
    }
  }

  const pending = tasks
    .filter((t) => t.status === "pending")
    .sort((a, b) => taskImportance(b) - taskImportance(a))
    .slice(0, 8)

  const done = tasks
    .filter(
      (t) =>
        t.status === "done" &&
        (t.due_date ? isThisWeek(t.due_date) : isThisWeek(t.created_at))
    )
    .slice(0, 4)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Resumen semanal</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Actualizado a las {format(lastUpdated, "HH:mm", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? "Actualizando..." : "Actualizar"}
          </button>
          <Link href="/tasks" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Ver todas
          </Link>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Pending */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pendientes</span>
            <span className="px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
              {pending.length}
            </span>
          </div>
          {pending.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">Sin tareas pendientes para esta semana.</p>
          ) : (
            <div className="space-y-2">
              {pending.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  token={token}
                  clientName={t.client_id ? clientMap[t.client_id] : undefined}
                  onToggle={handleToggle}
                  onDueDateChange={handleDueDateChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* Done this week */}
        {done.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completadas esta semana</span>
              <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                {done.length}
              </span>
            </div>
            <div className="space-y-2">
              {done.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  token={token}
                  clientName={t.client_id ? clientMap[t.client_id] : undefined}
                  onToggle={handleToggle}
                  onDueDateChange={handleDueDateChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
