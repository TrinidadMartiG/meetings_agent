"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { SimpleMarkdown } from "@/components/SimpleMarkdown"
import type { TaskComment } from "@/lib/api"
import { api } from "@/lib/api"

interface TaskCommentSectionProps {
  taskId: string
  token: string
  initialCount: number
}

export function TaskCommentSection({ taskId, token, initialCount }: TaskCommentSectionProps) {
  const [comments, setComments] = useState<TaskComment[] | null>(null)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = async () => {
    if (open) { setOpen(false); return }
    setOpen(true)
    if (comments !== null) return
    setLoading(true)
    try {
      const data = await api.getTaskComments(token, taskId)
      setComments(data)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    setSaving(true)
    setError(null)
    try {
      const comment = await api.createTaskComment(token, taskId, draft.trim())
      setComments((prev) => [...(prev ?? []), comment])
      setCount((c) => c + 1)
      setDraft("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    setComments((prev) => (prev ?? []).filter((c) => c.id !== commentId))
    setCount((c) => Math.max(0, c - 1))
    try {
      await api.deleteTaskComment(token, taskId, commentId)
    } catch {
      const data = await api.getTaskComments(token, taskId)
      setComments(data)
      setCount(data.length)
    }
  }

  return (
    <div className="border-t border-gray-100 pt-2.5 mt-1">
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-8 8l4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        {open ? "Ocultar comentarios" : "Comentarios"}
        <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
          count > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
        }`}>
          {count}
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {loading && <p className="text-xs text-gray-400">Cargando...</p>}

          {comments && comments.length === 0 && !loading && (
            <p className="text-xs text-gray-400 italic">Sin comentarios aún.</p>
          )}

          {comments && comments.map((c) => (
            <div key={c.id} className="group relative bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <SimpleMarkdown>{c.content}</SimpleMarkdown>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">
                  {(() => {
                    try { return format(parseISO(c.created_at), "d MMM yyyy HH:mm", { locale: es }) }
                    catch { return c.created_at }
                  })()}
                </span>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-500 transition-all"
                  title="Eliminar comentario"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          <form onSubmit={handleAdd} className="space-y-1.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe un comentario (soporta **markdown**, listas, etc.)"
              rows={2}
              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={saving || !draft.trim()}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Agregar"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
