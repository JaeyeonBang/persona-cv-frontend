'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { PersonaConfig, DocumentType } from '@/lib/types'
import { DEMO_USERNAME, DEFAULT_PERSONA_CONFIG } from '@/lib/constants'
import { sanitizeStorageKey } from '@/lib/sanitize-filename'
import { validatePdfFile, validateImageFile } from '@/lib/validations'

// ─── Profile ──────────────────────────────────────────────

const profileSchema = z.object({
  id: z.string().uuid(),
  username: z
    .string()
    .min(3, '3자 이상 입력해주세요')
    .max(30)
    .regex(/^[a-z0-9-]+$/, '영소문자, 숫자, 하이픈만 사용 가능합니다'),
  name: z.string().min(1, '이름을 입력해주세요').max(100),
  title: z.string().max(200),
  bio: z.string().max(500),
  photo_url: z.string().optional(),
})

export async function saveProfile(data: {
  id: string
  username: string
  name: string
  title: string
  bio: string
  photo_url: string
}): Promise<{ error?: string }> {
  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first.message }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('users')
    .update({
      username: parsed.data.username,
      name: parsed.data.name,
      title: parsed.data.title,
      bio: parsed.data.bio,
      photo_url: parsed.data.photo_url || null,
    })
    .eq('id', parsed.data.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}

// ─── Photo Upload ─────────────────────────────────────────

export async function uploadPhoto(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const file = formData.get('photo') as File | null
  const userId = formData.get('userId') as string | null

  if (!file || !userId) return { error: '파일 또는 사용자 ID가 없습니다' }
  const imageError = validateImageFile(file)
  if (imageError) return { error: imageError }

  const supabase = createAdminClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `avatars/${userId}.${ext}`

  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) return { error: `업로드 실패: ${error.message}` }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return { url: data.publicUrl }
}

// ─── Documents ────────────────────────────────────────────

const urlDocSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['url', 'github', 'linkedin', 'other']),
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  source_url: z.string().url('올바른 URL을 입력해주세요'),
})

export async function addDocumentUrl(data: {
  userId: string
  type: Exclude<DocumentType, 'pdf'>
  title: string
  source_url: string
}): Promise<{ id?: string; error?: string }> {
  const parsed = urlDocSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first.message }
  }

  const supabase = createAdminClient()
  const { data: inserted, error } = await supabase
    .from('documents')
    .insert({
      user_id: parsed.data.userId,
      type: parsed.data.type,
      title: parsed.data.title,
      source_url: parsed.data.source_url,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { id: inserted.id }
}

/** Storage에만 업로드 (DB 레코드 없음). 저장 버튼 클릭 전 취소 시 deleteStorageFile로 정리. */
export async function uploadPdfToStorage(
  formData: FormData,
): Promise<{ path: string; url: string; title: string } | { error: string }> {
  const file = formData.get('pdf') as File | null
  const userId = formData.get('userId') as string | null

  if (!file || !userId) return { error: '파일 또는 사용자 ID가 없습니다' }
  const pdfError = validatePdfFile(file)
  if (pdfError) return { error: pdfError }

  const supabase = createAdminClient()
  const safeName = sanitizeStorageKey(file.name)
  const path = `pdfs/${userId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, file)

  if (uploadError) return { error: `업로드 실패: ${uploadError.message}` }

  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
  return { path, url: urlData.publicUrl, title: file.name.replace(/\.pdf$/i, '') }
}

/** uploadPdfToStorage 후 저장 확정 시 DB 레코드를 생성한다. */
export async function savePdfDocument(data: {
  userId: string
  title: string
  storageUrl: string
}): Promise<{ id?: string; error?: string }> {
  if (!data.userId || !data.storageUrl) return { error: '잘못된 요청입니다' }

  const supabase = createAdminClient()
  const { data: inserted, error } = await supabase
    .from('documents')
    .insert({
      user_id: data.userId,
      type: 'pdf',
      title: data.title || 'document',
      source_url: data.storageUrl,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { id: inserted.id }
}

/** 미저장 PDF storage 파일을 정리한다. */
export async function deleteStorageFile(
  bucket: string,
  path: string,
): Promise<{ error?: string }> {
  if (!bucket || !path) return { error: '잘못된 요청입니다' }

  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) return { error: error.message }
  return {}
}

export async function deleteDocument(id: string): Promise<{ error?: string }> {
  if (!id) return { error: '잘못된 요청입니다' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('documents').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}

// ─── Persona Config ───────────────────────────────────────

export async function savePersonaConfig(
  userId: string,
  config: PersonaConfig,
): Promise<{ error?: string }> {
  if (!userId) return { error: '잘못된 요청입니다' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('users')
    .update({ persona_config: config })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}

// ─── Demo User Bootstrap ──────────────────────────────────

export async function ensureDemoUser() {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('username', DEMO_USERNAME)
    .maybeSingle()

  if (existing) return existing

  const { data, error } = await supabase
    .from('users')
    .insert({
      username: DEMO_USERNAME,
      name: '',
      title: '',
      bio: '',
      persona_config: DEFAULT_PERSONA_CONFIG,
    })
    .select('*')
    .single()

  if (error) throw new Error(`데모 유저 생성 실패: ${error.message}`)
  return data
}
