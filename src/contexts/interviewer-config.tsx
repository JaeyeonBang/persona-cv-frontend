'use client'

import { createContext, useContext, useState } from 'react'
import { DEFAULT_INTERVIEWER_CONFIG } from '@/lib/constants'
import type { InterviewerConfig } from '@/lib/types'

type InterviewerConfigContextType = {
  config: InterviewerConfig
  setConfig: (config: InterviewerConfig) => void
  updateConfig: (partial: Partial<InterviewerConfig>) => void
}

const InterviewerConfigContext = createContext<InterviewerConfigContextType | null>(null)

export function InterviewerConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<InterviewerConfig>(DEFAULT_INTERVIEWER_CONFIG)

  function updateConfig(partial: Partial<InterviewerConfig>) {
    setConfig((prev) => ({ ...prev, ...partial }))
  }

  return (
    <InterviewerConfigContext.Provider value={{ config, setConfig, updateConfig }}>
      {children}
    </InterviewerConfigContext.Provider>
  )
}

export function useInterviewerConfig() {
  const ctx = useContext(InterviewerConfigContext)
  if (!ctx) throw new Error('useInterviewerConfig must be used within InterviewerConfigProvider')
  return ctx
}
