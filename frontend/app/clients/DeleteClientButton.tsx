"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { api } from "@/lib/api"

interface DeleteClientButtonProps {
  clientId: string
  clientName: string
}

export function DeleteClientButton({ clientId, clientName }: DeleteClientButtonProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const token = session?.backendToken ?? ""

  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    try {
      await api.deleteClient(token, clientId)
      router.refresh()
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-gray-500">¿Eliminar <span className="font-medium text-gray-700">{clientName}</span>?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Confirmar"}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirming(false) }}
          className="text-xs px-2.5 py-1 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
      title="Eliminar cliente"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}
