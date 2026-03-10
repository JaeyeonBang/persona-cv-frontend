'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { saveProfile, uploadPhoto } from '@/app/dashboard/actions'
import type { User } from '@/lib/types'

interface Props {
  user: User
  showOnboardingRedirect?: boolean
}

export function ProfileSection({ user, showOnboardingRedirect = false }: Props) {
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [title, setTitle] = useState(user.title)
  const [bio, setBio] = useState(user.bio)
  const [username, setUsername] = useState(user.username)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photo_url)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: '이미지 파일만 선택할 수 있습니다' })
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect],
  )

  async function handleSave() {
    setIsSaving(true)
    setFeedback(null)

    try {
      let photo_url = user.photo_url ?? ''

      if (photoFile) {
        const fd = new FormData()
        fd.append('photo', photoFile)
        fd.append('userId', user.id)
        const result = await uploadPhoto(fd)
        if ('error' in result) throw new Error(result.error)
        photo_url = result.url
      }

      const result = await saveProfile({ id: user.id, username, name, title, bio, photo_url })
      if (result.error) throw new Error(result.error)

      setPhotoFile(null)

      if (showOnboardingRedirect) {
        router.push('/dashboard/qa')
        return
      }

      setFeedback({ type: 'success', message: '저장되었습니다' })
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : '저장에 실패했습니다',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="bg-white rounded-[2rem] p-6 lg:p-8 border border-zinc-100 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-800 mb-6">기본 정보</h2>

      {/* Photo upload */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative size-32 overflow-hidden rounded-3xl cursor-pointer border-2 border-dashed transition-colors ${
            isDragOver ? 'border-zinc-500 bg-zinc-100' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-400'
          }`}
        >
          {photoPreview ? (
            <Image src={photoPreview} alt="프로필 사진" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
              <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        <p className="text-xs text-zinc-400">클릭하거나 이미지를 드래그하세요</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
        <Field label="이름" value={name} onChange={setName} placeholder="홍길동" />
        <Field label="직책" value={title} onChange={setTitle} placeholder="Frontend Engineer @ Company" />
        <Field label="한줄 소개" value={bio} onChange={setBio} placeholder="저를 소개하는 한 줄..." multiline />
        <div>
          <Field
            label="공개 URL"
            value={username}
            onChange={setUsername}
            placeholder="username"
          />
          <p className="mt-1 text-xs text-zinc-400">
            personaid.app/<span className="font-medium text-zinc-600">{username || 'username'}</span>
          </p>
        </div>
      </div>

      {feedback && (
        <p className={`mt-4 text-sm ${feedback.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
          {feedback.message}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-6 w-full rounded-2xl bg-zinc-800 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  const baseClass =
    'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition-colors'

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </label>
  )
}
