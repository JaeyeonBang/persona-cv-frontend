export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl sm:p-8">
                {children}
            </div>
        </div>
    )
}
