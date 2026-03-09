import Image from 'next/image'
import type { Persona } from '@/lib/types'

interface Props {
  persona: Persona
}

export function ProfileHeader({ persona }: Props) {
  return (
    <div className="flex w-full flex-col sm:flex-row md:flex-col items-center sm:items-start md:items-center text-center sm:text-left md:text-center text-zinc-900 gap-4 md:gap-6">
      {/* Profile photo - Squared */}
      <div className="relative size-24 sm:size-32 md:size-56 shrink-0 overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5 bg-white">
        {persona.photoUrl && (
          <Image
            src={persona.photoUrl}
            alt={persona.name}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            priority
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        )}
        {/* Initials fallback */}
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 text-4xl sm:text-5xl md:text-7xl font-light text-zinc-400">
          {persona.name.charAt(0)}
        </div>
      </div>

      {/* Name & title */}
      <div className="flex flex-col flex-1 w-full items-center sm:items-start md:items-center">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-800">{persona.name}</h1>
        <p className="mt-1 md:mt-2 text-sm sm:text-base font-medium text-blue-600 tracking-wide uppercase">{persona.title}</p>
        {persona.bio && (
          <p className="mt-3 md:mt-4 text-sm sm:text-base leading-relaxed text-zinc-500 max-w-sm">
            {persona.bio}
          </p>
        )}
      </div>
    </div>
  )
}
