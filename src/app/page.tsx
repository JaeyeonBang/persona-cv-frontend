import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">PersonaID</h1>
        <p className="text-muted-foreground max-w-md text-lg">
          당신을 대신하는 AI 명함. 이력서와 포트폴리오를 학습한 디지털 트윈과 대화하세요.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-lg px-6 text-sm font-medium transition-opacity hover:opacity-90"
        >
          내 명함 만들기
        </Link>
        <Link
          href="/demo-user"
          className="border-border bg-background inline-flex h-10 items-center justify-center rounded-lg border px-6 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          데모 체험하기
        </Link>
      </div>
    </main>
  )
}
