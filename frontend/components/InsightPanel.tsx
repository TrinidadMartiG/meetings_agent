"use client"

import { useState } from "react"
import type { Insight, InsightType } from "@/lib/api"

interface InsightPanelProps {
  insights: Insight[]
  onProcessClick?: () => Promise<void>
  isProcessed: boolean
}

const insightConfig: Record<
  InsightType,
  { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }
> = {
  key_point: {
    label: "Punto clave",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  action_item: {
    label: "Accion",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  recommendation: {
    label: "Recomendacion",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  reminder: {
    label: "Recordatorio",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  client_context: {
    label: "Contexto cliente",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
}

const typeOrder: InsightType[] = [
  "action_item",
  "key_point",
  "recommendation",
  "reminder",
  "client_context",
]

export function InsightPanel({
  insights,
  onProcessClick,
  isProcessed,
}: InsightPanelProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const grouped = typeOrder.reduce<Record<InsightType, Insight[]>>(
    (acc, type) => {
      acc[type] = insights
        .filter((i) => i.type === type)
        .sort((a, b) => b.priority - a.priority)
      return acc
    },
    {} as Record<InsightType, Insight[]>
  )

  const handleProcess = async () => {
    if (!onProcessClick) return
    setProcessing(true)
    setError(null)
    try {
      await onProcessClick()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar")
    } finally {
      setProcessing(false)
    }
  }

  if (!isProcessed) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
        <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sin insights aun
        </h3>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          Procesa la reunion con IA para extraer puntos clave, acciones,
          recomendaciones y mas.
        </p>
        {onProcessClick && (
          <button
            onClick={handleProcess}
            disabled={processing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
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
                Procesando con IA...
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Procesar con IA
              </>
            )}
          </button>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <p className="text-gray-400 text-sm">No se encontraron insights.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {typeOrder.map((type) => {
        const items = grouped[type]
        if (items.length === 0) return null
        const config = insightConfig[type]

        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}
              >
                {config.icon}
                {config.label}
              </span>
              <span className="text-xs text-gray-400">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-3.5 rounded-xl border ${config.borderColor} ${config.bgColor}`}
                >
                  <p className={`text-sm leading-relaxed ${config.color.replace("700", "800")}`}>
                    {insight.content}
                  </p>
                  {insight.priority >= 8 && (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-orange-600">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Alta prioridad
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
