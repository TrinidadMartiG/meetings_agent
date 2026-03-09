"use client"

import { useState } from "react"

interface ClientExpandWrapperProps {
  header: React.ReactNode
  content: React.ReactNode
  defaultOpen?: boolean
}

export function ClientExpandWrapper({
  header,
  content,
  defaultOpen = false,
}: ClientExpandWrapperProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={`bg-white rounded-2xl border transition-all ${
        open ? "border-blue-200 shadow-sm" : "border-gray-200"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-gray-50 rounded-2xl transition-colors"
      >
        <div className="flex-1 min-w-0">{header}</div>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="border-t border-gray-100 pt-5">{content}</div>
        </div>
      )}
    </div>
  )
}
