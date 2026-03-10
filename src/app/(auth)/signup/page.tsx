import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { signup } from '@/app/(auth)/actions'

export const metadata = {
  title: '회원가입 | PersonaID',
}

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function SignupPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">회원가입</h1>
        <p className="text-sm text-zinc-500">새로운 계정을 만들고 나만의 명함을 만드세요.</p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <form action={signup} className="space-y-4">
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
          <label htmlFor="username" className="text-sm font-medium leading-none">
            사용자 이름 <span className="text-zinc-400">(명함 URL)</span>
          </label>
          <div className="flex items-center rounded-md border border-zinc-200 bg-white px-3 focus-within:ring-2 focus-within:ring-zinc-950 focus-within:ring-offset-2">
            <span className="select-none text-sm text-zinc-400">personaid.com/</span>
            <input
              id="username"
              name="username"
              type="text"
              required
              pattern="[a-z0-9-]+"
              title="영소문자, 숫자, 하이픈만 가능합니다."
              className="h-10 flex-1 bg-transparent py-2 text-sm placeholder:text-zinc-500 focus:outline-none"
              placeholder="minjun"
            />
          </div>
          <p className="text-xs text-zinc-400">영소문자, 숫자, 하이픈만 사용 가능</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium leading-none">
            비밀번호 <span className="text-zinc-400">(6자 이상)</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
          />
        </div>

        <Button type="submit" className="w-full">
          가입하기
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-zinc-600 underline-offset-4 hover:underline">
          로그인
        </Link>
      </div>
    </div>
  )
}
