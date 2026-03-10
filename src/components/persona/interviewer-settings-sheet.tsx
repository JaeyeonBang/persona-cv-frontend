'use client'

import { Settings2Icon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useInterviewerConfig } from '@/contexts/interviewer-config'
import { cn } from '@/lib/utils'

type SegmentOption<T extends string> = { value: T; label: string }

function SegmentControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
      {options.map((opt, idx) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 py-1.5 text-xs font-medium transition-colors',
            idx > 0 && 'border-l border-zinc-200',
            value === opt.value
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:bg-zinc-100'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      {children}
    </div>
  )
}

export function InterviewerSettingsSheet() {
  const { config, updateConfig } = useInterviewerConfig()

  return (
    <Sheet>
      <SheetTrigger className="flex size-9 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition-colors hover:bg-zinc-50">
        <Settings2Icon className="size-4 text-zinc-500" />
        <span className="sr-only">설정</span>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-[320px] flex-col gap-5 px-5 py-6">
        <SheetHeader>
          <SheetTitle>인터뷰 설정</SheetTitle>
        </SheetHeader>

        <Separator />

        <SettingRow label="답변 길이">
          <SegmentControl
            options={[
              { value: 'short', label: '간결' },
              { value: 'medium', label: '보통' },
              { value: 'long', label: '상세' },
            ]}
            value={config.answerLength}
            onChange={(v) => updateConfig({ answerLength: v })}
          />
        </SettingRow>

        <SettingRow label="언어">
          <SegmentControl
            options={[
              { value: 'ko', label: '한국어' },
              { value: 'en', label: 'English' },
            ]}
            value={config.language}
            onChange={(v) => updateConfig({ language: v })}
          />
        </SettingRow>

        <SettingRow label="말투">
          <SegmentControl
            options={[
              { value: 'formal', label: '격식체' },
              { value: 'casual', label: '반말' },
            ]}
            value={config.speechStyle}
            onChange={(v) => updateConfig({ speechStyle: v })}
          />
        </SettingRow>

        <SettingRow label="질문 스타일">
          <SegmentControl
            options={[
              { value: 'free', label: '자유형' },
              { value: 'interview', label: '면접관' },
              { value: 'chat', label: '대화형' },
            ]}
            value={config.questionStyle}
            onChange={(v) => updateConfig({ questionStyle: v })}
          />
        </SettingRow>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-700">출처 표시</p>
            <p className="text-xs text-zinc-400">답변 근거 문서를 함께 표시합니다</p>
          </div>
          <Switch
            checked={config.showCitation}
            onCheckedChange={(checked) => updateConfig({ showCitation: checked })}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
