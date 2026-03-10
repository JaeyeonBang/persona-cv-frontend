import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { requestPasswordReset } from '@/app/(auth)/actions'

export const metadata = {
  title: '비밀번호 찾기 | PersonaID',
}

interface Props {
  searchParams: Promise<{ error?: string; sent?: string }>
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error, sent } = await searchParams

  if (sent) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">이메일을 확인하세요</h1>
          <p className="text-sm text-zinc-500">
            비밀번호 재설정 링크를 이메일로 발송했습니다.
            <br />
            스팸함도 확인해주세요.
          </p>
        </div>
        <Link href="/login" className="text-sm text-zinc-600 underline-offset-4 hover:underline">
          로그인으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">비밀번호 찾기</h1>
        <p className="text-sm text-zinc-500">
          가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <form action={requestPasswordReset} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium leading-none">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
            placeholder="name@example.com"
          />
        </div>

        <Button type="submit" className="w-full">
          재설정 링크 발송
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link href="/login" className="text-zinc-600 underline-offset-4 hover:underline">
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
