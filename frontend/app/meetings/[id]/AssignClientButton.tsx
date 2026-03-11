"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { Client } from "@/lib/api"

interface AssignClientButtonProps {
  meetingId: string
  token: string
  clients: Client[]
}

export function AssignClientButton({ meetingId, token, clients }: AssignClientButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAssign = async () => {
    if (!selectedId) return
    setSaving(true)
    setError(null)
    try {
      await api.updateMeeting(token, meetingId, { client_id: selectedId })
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar cliente")
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 border border-dashed border-gray-300 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
        </svg>
        Asignar cliente
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        autoFocus
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Selecciona un cliente...</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={saving || !selectedId}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Asignar"}
      </button>
      <button
        onClick={() => { setOpen(false); setSelectedId("") }}
        className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
      >
        Cancelar
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  )
}
