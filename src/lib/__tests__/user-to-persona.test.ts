import { describe, it, expect } from 'vitest'
import { userToPersona } from '@/lib/user-to-persona'
import type { User } from '@/lib/types'

const BASE_USER: User = {
  id: '754abe76-feaf-4984-9c52-620fea30d33d',
  auth_id: null,
  username: 'test-user',
  name: '김민준',
  title: 'Frontend Engineer @ Kakao',
  bio: '사용자 경험을 최우선으로 생각하는 프론트엔드 개발자',
  photo_url: 'https://example.com/photo.jpg',
  persona_config: {
    preset: 'friendly',
    custom_prompt: '친근하게 답변해주세요',
    default_interviewer: {
      answer_length: 'medium',
      language: 'ko',
      speech_style: 'formal',
      question_style: 'free',
      show_citation: true,
    },
    suggested_questions: ['자기소개 해줘', '주요 프로젝트는?'],
  },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('userToPersona', () => {
  it('username을 올바르게 매핑한다', () => {
    const persona = userToPersona(BASE_USER)
    expect(persona.username).toBe('test-user')
  })

  it('name, title, bio를 올바르게 매핑한다', () => {
    const persona = userToPersona(BASE_USER)
    expect(persona.name).toBe('김민준')
    expect(persona.title).toBe('Frontend Engineer @ Kakao')
    expect(persona.bio).toBe('사용자 경험을 최우선으로 생각하는 프론트엔드 개발자')
  })

  it('photo_url을 photoUrl로 매핑한다', () => {
    const persona = userToPersona(BASE_USER)
    expect(persona.photoUrl).toBe('https://example.com/photo.jpg')
  })

  it('photo_url이 null이면 null로 변환한다', () => {
    const user: User = { ...BASE_USER, photo_url: null }
    const persona = userToPersona(user)
    expect(persona.photoUrl).toBeNull()
  })

  it('suggested_questions를 suggestedQuestions로 매핑한다', () => {
    const persona = userToPersona(BASE_USER)
    expect(persona.suggestedQuestions).toEqual(['자기소개 해줘', '주요 프로젝트는?'])
  })

  it('persona_config.preset을 personaPreset으로 매핑한다', () => {
    const persona = userToPersona(BASE_USER)
    expect(persona.personaPreset).toBe('friendly')
  })

  it('suggested_questions가 비어있으면 빈 배열을 반환한다', () => {
    const user: User = {
      ...BASE_USER,
      persona_config: { ...BASE_USER.persona_config, suggested_questions: [] },
    }
    const persona = userToPersona(user)
    expect(persona.suggestedQuestions).toEqual([])
  })
})
