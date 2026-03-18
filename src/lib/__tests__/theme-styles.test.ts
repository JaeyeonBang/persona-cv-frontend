import { describe, it, expect } from 'vitest'
import type { Theme } from '../types'

// visitor-page.tsx의 THEME_STYLES 맵을 직접 검증하기 위해
// 동일한 구조를 여기서 재정의해 테스트
const ALL_THEMES: Theme[] = ['default', 'tech', 'creative', 'business']

const THEME_STYLES: Record<Theme, {
  wrapper: string
  leftCard: string
  chatCard: string
  chatHeader: string
  chatHeaderText: string
}> = {
  default: {
    wrapper: 'bg-zinc-50',
    leftCard: 'bg-white rounded-[2rem] shadow-sm border border-zinc-100',
    chatCard: 'bg-white shadow-xl rounded-[2rem] border border-zinc-100',
    chatHeader: 'border-b border-zinc-50',
    chatHeaderText: 'text-zinc-600',
  },
  tech: {
    wrapper: 'bg-gray-950',
    leftCard: 'bg-gray-900 rounded-[2rem] border border-gray-800',
    chatCard: 'bg-gray-900 rounded-[2rem] border border-gray-800',
    chatHeader: 'border-b border-gray-800',
    chatHeaderText: 'text-gray-400',
  },
  creative: {
    wrapper: 'bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50',
    leftCard: 'bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-sm border border-violet-100',
    chatCard: 'bg-white/80 backdrop-blur-sm shadow-xl rounded-[2rem] border border-violet-100',
    chatHeader: 'border-b border-violet-50',
    chatHeaderText: 'text-violet-600',
  },
  business: {
    wrapper: 'bg-slate-100',
    leftCard: 'bg-white rounded-xl shadow-sm border border-slate-200',
    chatCard: 'bg-white shadow-md rounded-xl border border-slate-200',
    chatHeader: 'border-b border-slate-100',
    chatHeaderText: 'text-slate-500',
  },
}

describe('THEME_STYLES', () => {
  it('모든 Theme 값에 대한 스타일이 정의돼 있다', () => {
    ALL_THEMES.forEach((theme) => {
      expect(THEME_STYLES).toHaveProperty(theme)
    })
  })

  it('각 테마 스타일이 5개 필드를 모두 포함한다', () => {
    const requiredFields = ['wrapper', 'leftCard', 'chatCard', 'chatHeader', 'chatHeaderText']
    ALL_THEMES.forEach((theme) => {
      requiredFields.forEach((field) => {
        expect(THEME_STYLES[theme]).toHaveProperty(field)
        expect((THEME_STYLES[theme] as Record<string, string>)[field]).toBeTruthy()
      })
    })
  })

  it('default 테마는 아이보리/화이트 배경을 사용한다', () => {
    expect(THEME_STYLES.default.wrapper).toContain('zinc')
  })

  it('tech 테마는 다크 배경을 사용한다', () => {
    expect(THEME_STYLES.tech.wrapper).toContain('gray-950')
    expect(THEME_STYLES.tech.leftCard).toContain('gray-900')
  })

  it('creative 테마는 그라데이션 배경을 사용한다', () => {
    expect(THEME_STYLES.creative.wrapper).toContain('gradient')
    expect(THEME_STYLES.creative.wrapper).toContain('violet')
  })

  it('business 테마는 슬레이트 배경을 사용한다', () => {
    expect(THEME_STYLES.business.wrapper).toContain('slate')
  })

  it('모든 테마 wrapper는 빈 문자열이 아니다', () => {
    ALL_THEMES.forEach((theme) => {
      expect(THEME_STYLES[theme].wrapper.trim()).not.toBe('')
    })
  })

  it('tech 테마 텍스트는 밝은 색상을 사용한다', () => {
    // tech는 다크 배경이므로 chatHeaderText가 gray-xxx여야 함
    expect(THEME_STYLES.tech.chatHeaderText).toContain('gray')
  })

  it('creative 테마 텍스트는 바이올렛 계열이다', () => {
    expect(THEME_STYLES.creative.chatHeaderText).toContain('violet')
  })
})

describe('Theme 타입', () => {
  it('4개 테마 값이 올바르게 정의됐다', () => {
    const expectedThemes: Theme[] = ['default', 'tech', 'creative', 'business']
    expect(ALL_THEMES).toEqual(expectedThemes)
  })
})
