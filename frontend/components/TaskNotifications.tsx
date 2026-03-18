"use client"

import { useEffect } from "react"
import { differenceInDays, parseISO, startOfDay } from "date-fns"
import type { Task } from "@/lib/api"

const STORAGE_KEY = "kam_notified_task_ids"

function getNotifiedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveNotifiedId(id: string) {
  try {
    const ids = getNotifiedIds()
    ids.add(id)
    // Keep only last 200 to avoid unbounded growth
    const arr = [...ids].slice(-200)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch {}
}

function urgencyLabel(daysLeft: number): string {
  if (daysLeft < 0) return "⚠️ VENCIDA"
  if (daysLeft === 0) return "⚠️ Vence HOY"
  if (daysLeft === 1) return "📅 Vence mañana"
  return `📅 Vence en ${daysLeft} días`
}

export function TaskNotifications({ tasks }: { tasks: Task[] }) {
  useEffect(() => {
    if (typeof window === "undefined") return

    const notify = async () => {
      // Only check tasks due within 3 days (including overdue)
      const today = startOfDay(new Date())
      const urgent = tasks.filter((t) => {
        if (t.status === "done" || !t.due_date) return false
        const daysLeft = differenceInDays(startOfDay(parseISO(t.due_date)), today)
        return daysLeft <= 3
      })

      if (urgent.length === 0) return

      // Request permission if not already granted
      if (Notification.permission === "denied") return
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission()
        if (result !== "granted") return
      }

      const notifiedIds = getNotifiedIds()
      // Use today's date as part of the key so notifications repeat daily
      const todayKey = today.toISOString().slice(0, 10)

      for (const task of urgent) {
        const notifKey = `${task.id}_${todayKey}`
        if (notifiedIds.has(notifKey)) continue

        const daysLeft = differenceInDays(startOfDay(parseISO(task.due_date!)), today)
        const label = urgencyLabel(daysLeft)
        const shortDesc = task.description.length > 80
          ? task.description.slice(0, 80) + "..."
          : task.description

        new Notification(`${label} — Tarea KAM`, {
          body: shortDesc,
          icon: "/favicon.ico",
          tag: notifKey, // browser deduplicates by tag
        })

        saveNotifiedId(notifKey)
      }
    }

    // Small delay so page load completes first
    const timer = setTimeout(notify, 2000)
    return () => clearTimeout(timer)
  }, [tasks])

  return null
}
