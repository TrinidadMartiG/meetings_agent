"use client"

import { useState } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import type { Client, Insight, InsightType, MeetingListItem } from "@/lib/api"

interface ClientKnowledgeBaseProps {
  client: Client
  insights: Insight[]
  meetings: MeetingListItem[]
}

const insightConfig: Record<
  InsightType,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  key_point: {
    label: "Punto clave",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  action_item: {
    label: "Accion",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  recommendation: {
    label: "Recomendacion",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  reminder: {
    label: "Recordatorio",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  client_context: {
    label: "Contexto",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
}

const typeOrder: InsightType[] = [
  "client_context",
  "key_point",
  "action_item",
  "recommendation",
  "reminder",
]

type TabKey = InsightType | "history"

export function ClientKnowledgeBase({
  client,
  insights,
  meetings,
}: ClientKnowledgeBaseProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("client_context")

  // Build a lookup map: meeting_id → {title, date}
  const meetingMap = Object.fromEntries(
    meetings.map((m) => [
      m.id,
      {
        title: m.title,
        date: (() => {
          try {
            return format(parseISO(m.meeting_date), "d MMM yyyy", { locale: es })
          } catch {
            return m.meeting_date
          }
        })(),
        id: m.id,
      },
    ])
  )

  const grouped = typeOrder.reduce<Record<InsightType, Insight[]>>(
    (acc, type) => {
      acc[type] = insights
        .filter((i) => i.type === type)
        // Sort by meeting date desc (most recent first), then by priority
        .sort((a, b) => {
          const dateA = meetings.find((m) => m.id === a.meeting_id)?.meeting_date ?? ""
          const dateB = meetings.find((m) => m.id === b.meeting_id)?.meeting_date ?? ""
          if (dateB !== dateA) return dateB.localeCompare(dateA)
          return b.priority - a.priority
        })
      return acc
    },
    {} as Record<InsightType, Insight[]>
  )

  const sortedMeetings = [...meetings].sort(
    (a, b) =>
      new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
  )

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    ...typeOrder.map((type) => ({
      key: type as TabKey,
      label: insightConfig[type].label,
      count: grouped[type].length,
    })),
    { key: "history", label: "Historial", count: meetings.length },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Client header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {client.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{client.name}</h2>
            <p className="text-blue-100 text-sm">
              {meetings.length} reunion{meetings.length !== 1 ? "es" : ""} &middot;{" "}
              {insights.length} insight{insights.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-1 overflow-x-auto py-1 scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === "history" ? (
          <div className="space-y-3">
            {sortedMeetings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No hay reuniones registradas
              </p>
            ) : (
              sortedMeetings.map((meeting) => {
                const date = (() => {
                  try {
                    return format(parseISO(meeting.meeting_date), "d MMM yyyy", {
                      locale: es,
                    })
                  } catch {
                    return meeting.meeting_date
                  }
                })()

                return (
                  <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                        {meeting.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{date}</p>
                    </div>
                    <span
                      className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                        meeting.processed
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {meeting.processed ? "Procesado" : "Pendiente"}
                    </span>
                  </Link>
                )
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {grouped[activeTab as InsightType].length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No hay insights de este tipo
              </p>
            ) : (
              grouped[activeTab as InsightType].map((insight) => {
                const config = insightConfig[insight.type]
                const source = meetingMap[insight.meeting_id]
                return (
                  <div
                    key={insight.id}
                    className={`p-3.5 rounded-xl border ${config.borderColor} ${config.bgColor}`}
                  >
                    <p className={`text-sm leading-relaxed ${config.color}`}>
                      {insight.content}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2">
                      {/* Source: meeting title + date */}
                      {source && (
                        <Link
                          href={`/meetings/${source.id}`}
                          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate max-w-[200px]">{source.title}</span>
                          <span className="text-gray-300">·</span>
                          <span className="shrink-0">{source.date}</span>
                        </Link>
                      )}

                      {insight.priority >= 8 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Alta prioridad
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
