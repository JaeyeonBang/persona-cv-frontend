import { createAdminClient } from '@/lib/supabase/admin'
import { VisitorPage } from '@/components/persona/visitor-page'
import { userToPersona } from '@/lib/user-to-persona'
import type { User, Document } from '@/lib/types'

/** Storage URL에서 버킷 내 경로 추출
 *  예: .../object/public/documents/pdfs/user-id/file.pdf → pdfs/user-id/file.pdf
 *  예: .../object/sign/documents/pdfs/... → pdfs/user-id/file.pdf
 */
function extractStoragePath(url: string): string | null {
  const match = url.match(/\/object\/(?:public|sign)\/documents\/(.+?)(?:\?|$)/)
  return match ? match[1] : null
}

interface Props {
  params: Promise<{ username: string }>
}

export default async function PersonaPage({ params }: Props) {
  const { username } = await params

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-zinc-800">존재하지 않는 명함입니다.</p>
          <p className="mt-1 text-sm text-zinc-400">@{username}</p>
        </div>
      </main>
    )
  }

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'done')
    .order('created_at', { ascending: false })

  // PDF 문서는 비공개 버킷이므로 Signed URL(1시간)로 교체
  const signedDocs = await Promise.all(
    (documents ?? []).map(async (doc) => {
      if (doc.type !== 'pdf' || !doc.source_url) return doc
      const storagePath = extractStoragePath(doc.source_url)
      if (!storagePath) return doc
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 3600)
      if (error) console.error('[signedUrl] error:', error.message, '| path:', storagePath)
      return data?.signedUrl ? { ...doc, source_url: data.signedUrl } : doc
    })
  )

  return (
    <VisitorPage
      persona={userToPersona(user as User)}
      documents={signedDocs as Document[]}
    />
  )
}
