"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

interface ProcessButtonProps {
  meetingId: string
  token: string
}

export function ProcessButton({ meetingId, token }: ProcessButtonProps) {
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [statusText, setStatusText] = useState("Procesar con IA")
  const [error, setError] = useState<string | null>(null)

  const handleProcess = async () => {
    setProcessing(true)
    setError(null)
    setStatusText("Iniciando...")

    try {
      await api.processMeeting(token, meetingId)
      setStatusText("Analizando con Gemini...")

      // Poll until the meeting is marked as processed
      const poll = async (attempts: number) => {
        if (attempts > 30) {
          setError("El procesamiento tardó demasiado. Recarga la página.")
          setProcessing(false)
          return
        }
        try {
          const meeting = await api.getMeeting(token, meetingId)
          if (meeting.processed) {
            router.refresh()
          } else {
            setTimeout(() => poll(attempts + 1), 2000)
          }
        } catch {
          setTimeout(() => poll(attempts + 1), 2000)
        }
      }

      setTimeout(() => poll(0), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar")
      setProcessing(false)
      setStatusText("Procesar con IA")
    }
  }

  return (
    <div>
      <button
        onClick={handleProcess}
        disabled={processing}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {statusText}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {statusText}
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{error}</p>
      )}
    </div>
  )
}
