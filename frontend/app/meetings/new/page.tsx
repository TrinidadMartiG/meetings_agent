"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { NavBar } from "@/components/NavBar"
import { api } from "@/lib/api"
import type { Client } from "@/lib/api"

export default function NewMeetingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const token = session?.backendToken ?? ""

  const [title, setTitle] = useState("")
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [clientId, setClientId] = useState("")
  const [newClientName, setNewClientName] = useState("")
  const [showNewClient, setShowNewClient] = useState(false)
  const [transcription, setTranscription] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) return
    setLoadingClients(true)
    api
      .getClients(token)
      .then(setClients)
      .catch(() => {})
      .finally(() => setLoadingClients(false))
  }, [token])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError(null)
    if (!file) return

    if (!file.name.endsWith(".txt")) {
      setFileError("Solo se permiten archivos .txt")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError("El archivo no puede superar 5MB")
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setTranscription(text)
    }
    reader.onerror = () => {
      setFileError("Error al leer el archivo")
    }
    reader.readAsText(file, "UTF-8")
  }

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return
    setCreatingClient(true)
    setError(null)
    try {
      const client = await api.createClient(token, newClientName.trim())
      setClients((prev) => [...prev, client])
      setClientId(client.id)
      setNewClientName("")
      setShowNewClient(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear el cliente"
      )
    } finally {
      setCreatingClient(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !transcription.trim() || !meetingDate) return

    setSubmitting(true)
    setError(null)

    try {
      const meeting = await api.createMeeting(token, {
        title: title.trim(),
        meeting_date: meetingDate,
        client_id: clientId || undefined,
        transcription_text: transcription,
      })
      router.push(`/meetings/${meeting.id}?new=true`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear la reunion"
      )
      setSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/meetings"
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Importar reunion
            </h1>
            <p className="text-sm text-gray-500">
              Carga la transcripcion para procesar con IA
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Informacion de la reunion</h2>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Titulo *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej. Reunion de seguimiento Q1 con Acme Corp"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="meeting-date"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Fecha de la reunion *
              </label>
              <input
                id="meeting-date"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Client selector */}
            <div>
              <label
                htmlFor="client"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Cliente
              </label>
              {loadingClients ? (
                <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
              ) : (
                <div className="flex gap-2">
                  <select
                    id="client"
                    value={clientId}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setShowNewClient(true)
                        setClientId("")
                      } else {
                        setClientId(e.target.value)
                        setShowNewClient(false)
                      }
                    }}
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Sin cliente asignado</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__new__">+ Crear nuevo cliente</option>
                  </select>
                </div>
              )}

              {/* New client inline form */}
              {showNewClient && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nombre del cliente"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleCreateClient()
                      }
                    }}
                    className="flex-1 border border-blue-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateClient}
                    disabled={creatingClient || !newClientName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    {creatingClient ? "Creando..." : "Crear"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewClient(false)
                      setNewClientName("")
                    }}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Transcription */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Transcripcion *</h2>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Cargar archivo .txt
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* File drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              {fileName ? (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {fileName} cargado
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Haz clic para cargar un archivo .txt, o pega el texto abajo
                </p>
              )}
              {fileError && (
                <p className="text-xs text-red-600 mt-1">{fileError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="transcription"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Texto de la transcripcion
              </label>
              <textarea
                id="transcription"
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                placeholder="Pega aqui la transcripcion de la reunion..."
                rows={12}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none scrollbar-thin"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {transcription.length.toLocaleString()} caracteres
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pb-4">
            <button
              type="submit"
              disabled={
                submitting ||
                !title.trim() ||
                !transcription.trim() ||
                !meetingDate
              }
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Guardar reunion
                </>
              )}
            </button>
            <Link
              href="/meetings"
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
