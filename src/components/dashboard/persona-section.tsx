'use client'

import { useState } from 'react'
import { savePersonaConfig } from '@/app/dashboard/actions'
import type { User, PersonaConfig, PersonaPreset, DefaultInterviewer } from '@/lib/types'

interface Props {
  user: User
}

const PRESETS: { value: PersonaPreset; label: string; desc: string }[] = [
  { value: 'professional', label: '전문적', desc: '격식 있고 명확한 답변' },
  { value: 'friendly', label: '친근한', desc: '편안하고 따뜻한 말투' },
  { value: 'challenger', label: '도전적', desc: '날카롭고 직접적인 피드백' },
]

const ANSWER_LENGTH_OPTIONS: { value: DefaultInterviewer['answer_length']; label: string }[] = [
  { value: 'short', label: '간결' },
  { value: 'medium', label: '보통' },
  { value: 'long', label: '상세' },
]

const LANGUAGE_OPTIONS: { value: DefaultInterviewer['language']; label: string }[] = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
]

const SPEECH_STYLE_OPTIONS: { value: DefaultInterviewer['speech_style']; label: string }[] = [
  { value: 'formal', label: '격식체' },
  { value: 'casual', label: '반말' },
]

const QUESTION_STYLE_OPTIONS: { value: DefaultInterviewer['question_style']; label: string }[] = [
  { value: 'free', label: '자유형' },
  { value: 'interview', label: '면접관 모드' },
  { value: 'chat', label: '가벼운 대화' },
]

export function PersonaSection({ user }: Props) {
  const [config, setConfig] = useState<PersonaConfig>(user.persona_config)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  function updateInterviewer<K extends keyof DefaultInterviewer>(
    key: K,
    value: DefaultInterviewer[K],
  ) {
    setConfig((prev) => ({
      ...prev,
      default_interviewer: { ...prev.default_interviewer, [key]: value },
    }))
  }

  async function handleSave() {
    setIsSaving(true)
    setFeedback(null)
    const result = await savePersonaConfig(user.id, config)
    setFeedback(
      result.error
        ? { type: 'error', message: result.error }
        : { type: 'success', message: '저장되었습니다' },
    )
    setIsSaving(false)
  }

  return (
    <section className="bg-white rounded-[2rem] p-6 lg:p-8 border border-zinc-100 shadow-sm flex flex-col h-full">
      <h2 className="text-lg font-semibold text-zinc-800 mb-6">페르소나 설정</h2>

      <div className="flex-1 overflow-y-auto">
      {/* Preset buttons */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-medium text-zinc-500">말투 프리셋</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setConfig((prev) => ({ ...prev, preset: preset.value }))}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                config.preset === preset.value
                  ? 'border-zinc-800 bg-zinc-800 text-white'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400'
              }`}
            >
              <span className="text-sm font-semibold">{preset.label}</span>
              <span className={`text-xs ${config.preset === preset.value ? 'text-zinc-300' : 'text-zinc-400'}`}>
                {preset.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom prompt */}
      <div className="mb-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-500">페르소나 보완 (선택)</span>
          <textarea
            value={config.custom_prompt}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, custom_prompt: e.target.value }))
            }
            placeholder="예: 답변할 때 항상 구체적인 수치를 포함해주세요. 겸손하게 표현해주세요."
            rows={3}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
          />
        </label>
      </div>

      {/* Interviewer defaults */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-medium text-zinc-500">방문자 기본 설정</p>
        <div className="flex flex-col gap-4">

          <OptionRow label="답변 길이">
            <ToggleGroup
              options={ANSWER_LENGTH_OPTIONS}
              value={config.default_interviewer.answer_length}
              onChange={(v) => updateInterviewer('answer_length', v)}
            />
          </OptionRow>

          <OptionRow label="언어">
            <ToggleGroup
              options={LANGUAGE_OPTIONS}
              value={config.default_interviewer.language}
              onChange={(v) => updateInterviewer('language', v)}
            />
          </OptionRow>

          <OptionRow label="말투">
            <ToggleGroup
              options={SPEECH_STYLE_OPTIONS}
              value={config.default_interviewer.speech_style}
              onChange={(v) => updateInterviewer('speech_style', v)}
            />
          </OptionRow>

          <OptionRow label="질문 스타일">
            <ToggleGroup
              options={QUESTION_STYLE_OPTIONS}
              value={config.default_interviewer.question_style}
              onChange={(v) => updateInterviewer('question_style', v)}
            />
          </OptionRow>

          <OptionRow label="출처 표시">
            <button
              onClick={() =>
                updateInterviewer('show_citation', !config.default_interviewer.show_citation)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.default_interviewer.show_citation ? 'bg-zinc-800' : 'bg-zinc-200'
              }`}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
                  config.default_interviewer.show_citation ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </OptionRow>
        </div>
      </div>

      {feedback && (
        <p className={`mb-4 text-sm ${feedback.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
          {feedback.message}
        </p>
      )}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-4 w-full rounded-2xl bg-zinc-800 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </section>
  )
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="shrink-0 text-sm text-zinc-600">{label}</span>
      {children}
    </div>
  )
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? 'bg-zinc-800 text-white'
              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
