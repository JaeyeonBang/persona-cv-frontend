import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { login } from '@/app/(auth)/actions'

export const metadata = {
  title: '로그인 | PersonaID',
}

interface Props {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error, message, next } = await searchParams

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">로그인</h1>
        <p className="text-sm text-zinc-500">계정에 로그인하여 시작하세요.</p>
      </div>

      {message && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-center text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <form action={login} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium leading-none">
              비밀번호
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 underline-offset-4 hover:underline"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
          />
        </div>

        <Button type="submit" className="w-full">
          로그인
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-zinc-600 underline-offset-4 hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  )
}
