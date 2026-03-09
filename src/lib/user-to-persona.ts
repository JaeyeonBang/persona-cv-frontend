import type { User } from '@/lib/types'
import type { Persona } from '@/lib/types'

export function userToPersona(user: User): Persona {
  return {
    username: user.username,
    name: user.name,
    title: user.title,
    bio: user.bio,
    photoUrl: user.photo_url ?? null,
    suggestedQuestions: user.persona_config.suggested_questions,
    personaPreset: user.persona_config.preset,
  }
}
