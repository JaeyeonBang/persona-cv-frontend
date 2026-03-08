import { describe, it, expect } from 'vitest'
import { DEFAULT_INTERVIEWER_CONFIG } from '@/lib/constants'
import type { InterviewerConfig } from '@/lib/types'

/**
 * InterviewerConfig 상태 관리 로직 테스트
 *
 * InterviewerConfigProvider의 updateConfig는
 * (prev, partial) => ({ ...prev, ...partial }) 패턴을 사용한다.
 * 이 파일은 해당 불변 업데이트 로직을 순수 함수로 검증한다.
 */

function updateConfig(
  prev: InterviewerConfig,
  partial: Partial<InterviewerConfig>,
): InterviewerConfig {
  return { ...prev, ...partial }
}

// ── DEFAULT_INTERVIEWER_CONFIG 형상 ─────────────────────────────────────────

describe('DEFAULT_INTERVIEWER_CONFIG', () => {
  it('answerLength 기본값은 medium', () => {
    expect(DEFAULT_INTERVIEWER_CONFIG.answerLength).toBe('medium')
  })

  it('language 기본값은 ko', () => {
    expect(DEFAULT_INTERVIEWER_CONFIG.language).toBe('ko')
  })

  it('speechStyle 기본값은 formal', () => {
    expect(DEFAULT_INTERVIEWER_CONFIG.speechStyle).toBe('formal')
  })

  it('questionStyle 기본값은 free', () => {
    expect(DEFAULT_INTERVIEWER_CONFIG.questionStyle).toBe('free')
  })

  it('showCitation 기본값은 true', () => {
    expect(DEFAULT_INTERVIEWER_CONFIG.showCitation).toBe(true)
  })

  it('모든 필수 키가 존재한다', () => {
    const keys: (keyof InterviewerConfig)[] = [
      'answerLength',
      'language',
      'speechStyle',
      'questionStyle',
      'showCitation',
    ]
    for (const key of keys) {
      expect(DEFAULT_INTERVIEWER_CONFIG).toHaveProperty(key)
    }
  })
})

// ── updateConfig 불변성 ──────────────────────────────────────────────────────

describe('updateConfig 불변성', () => {
  it('원본 객체를 변경하지 않는다', () => {
    const original: InterviewerConfig = { ...DEFAULT_INTERVIEWER_CONFIG }
    const frozen = Object.freeze({ ...original })
    // freeze된 객체를 변경하려 하면 strict mode에서 throw
    expect(() => updateConfig(frozen, { language: 'en' })).not.toThrow()
    expect(original.language).toBe('ko')
  })

  it('새 객체를 반환한다', () => {
    const prev: InterviewerConfig = { ...DEFAULT_INTERVIEWER_CONFIG }
    const next = updateConfig(prev, { language: 'en' })
    expect(next).not.toBe(prev)
  })
})

// ── updateConfig 개별 필드 업데이트 ──────────────────────────────────────────

describe('updateConfig 필드 업데이트', () => {
  const base = DEFAULT_INTERVIEWER_CONFIG

  it('answerLength를 short으로 변경한다', () => {
    const result = updateConfig(base, { answerLength: 'short' })
    expect(result.answerLength).toBe('short')
  })

  it('answerLength를 long으로 변경한다', () => {
    const result = updateConfig(base, { answerLength: 'long' })
    expect(result.answerLength).toBe('long')
  })

  it('language를 en으로 변경한다', () => {
    const result = updateConfig(base, { language: 'en' })
    expect(result.language).toBe('en')
  })

  it('speechStyle을 casual로 변경한다', () => {
    const result = updateConfig(base, { speechStyle: 'casual' })
    expect(result.speechStyle).toBe('casual')
  })

  it('questionStyle을 interview로 변경한다', () => {
    const result = updateConfig(base, { questionStyle: 'interview' })
    expect(result.questionStyle).toBe('interview')
  })

  it('questionStyle을 chat으로 변경한다', () => {
    const result = updateConfig(base, { questionStyle: 'chat' })
    expect(result.questionStyle).toBe('chat')
  })

  it('showCitation을 false로 변경한다', () => {
    const result = updateConfig(base, { showCitation: false })
    expect(result.showCitation).toBe(false)
  })
})

// ── updateConfig 부분 업데이트 ──────────────────────────────────────────────

describe('updateConfig 부분 업데이트', () => {
  const base = DEFAULT_INTERVIEWER_CONFIG

  it('변경하지 않은 필드는 원래 값을 유지한다', () => {
    const result = updateConfig(base, { language: 'en' })
    expect(result.answerLength).toBe(base.answerLength)
    expect(result.speechStyle).toBe(base.speechStyle)
    expect(result.questionStyle).toBe(base.questionStyle)
    expect(result.showCitation).toBe(base.showCitation)
  })

  it('여러 필드를 동시에 변경한다', () => {
    const result = updateConfig(base, {
      language: 'en',
      speechStyle: 'casual',
      showCitation: false,
    })
    expect(result.language).toBe('en')
    expect(result.speechStyle).toBe('casual')
    expect(result.showCitation).toBe(false)
    expect(result.answerLength).toBe(base.answerLength)
    expect(result.questionStyle).toBe(base.questionStyle)
  })

  it('빈 partial을 전달하면 원본과 동일한 값을 가진다', () => {
    const result = updateConfig(base, {})
    expect(result).toEqual(base)
  })
})
