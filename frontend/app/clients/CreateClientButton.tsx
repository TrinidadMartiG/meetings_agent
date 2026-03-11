"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useSession } from "next-auth/react"

export function CreateClientButton() {
  const router = useRouter()
  const { data: session } = useSession()
  const token = session?.backendToken ?? ""

  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await api.createClient(token, name.trim())
      setName("")
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cliente")
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo cliente
      </button>
    )
  }

  return (
    <form onSubmit={handleCreate} className="flex items-center gap-2 flex-wrap justify-end">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del cliente"
        autoFocus
        className="text-sm border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
      />
      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
      >
        {saving ? "Creando..." : "Crear"}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setName("") }}
        className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
      >
        Cancelar
      </button>
      {error && <p className="w-full text-right text-xs text-red-600">{error}</p>}
    </form>
  )
}
