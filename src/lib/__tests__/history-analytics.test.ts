import { describe, it, expect } from 'vitest'
import { buildDailyData, buildFaq, calcSatisfactionRate } from '../history-analytics'

// ── buildDailyData ────────────────────────────────────────────────────────────

describe('buildDailyData', () => {
  const today = new Date('2026-03-18T12:00:00Z')

  it('기본값 7일치 항목을 반환한다', () => {
    const result = buildDailyData([], 7, today)
    expect(result).toHaveLength(7)
  })

  it('days 파라미터에 따라 항목 수가 달라진다', () => {
    expect(buildDailyData([], 14, today)).toHaveLength(14)
    expect(buildDailyData([], 3, today)).toHaveLength(3)
  })

  it('각 항목이 date, label, count 필드를 갖는다', () => {
    const [entry] = buildDailyData([], 1, today)
    expect(entry).toHaveProperty('date')
    expect(entry).toHaveProperty('label')
    expect(entry).toHaveProperty('count')
  })

  it('date 형식이 YYYY-MM-DD이다', () => {
    const result = buildDailyData([], 7, today)
    result.forEach((e) => expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/))
  })

  it('label 형식이 M/D이다', () => {
    const result = buildDailyData([], 7, today)
    result.forEach((e) => expect(e.label).toMatch(/^\d{1,2}\/\d{1,2}$/))
  })

  it('오늘 날짜가 마지막 항목이다', () => {
    const result = buildDailyData([], 7, today)
    const last = result[result.length - 1]
    expect(last.date).toBe('2026-03-18')
  })

  it('첫 번째 항목은 (days-1)일 전이다', () => {
    const result = buildDailyData([], 7, today)
    expect(result[0].date).toBe('2026-03-12')
  })

  it('창 안의 대화를 날짜별로 집계한다', () => {
    const convs = [
      { created_at: '2026-03-18T10:00:00Z' },
      { created_at: '2026-03-18T11:00:00Z' },
      { created_at: '2026-03-17T09:00:00Z' },
    ]
    const result = buildDailyData(convs, 7, today)
    const mar18 = result.find((d) => d.date === '2026-03-18')!
    const mar17 = result.find((d) => d.date === '2026-03-17')!
    expect(mar18.count).toBe(2)
    expect(mar17.count).toBe(1)
  })

  it('창 밖의 대화는 집계하지 않는다', () => {
    const convs = [{ created_at: '2026-03-01T10:00:00Z' }] // 7일 밖
    const result = buildDailyData(convs, 7, today)
    const total = result.reduce((s, d) => s + d.count, 0)
    expect(total).toBe(0)
  })

  it('대화가 없으면 모든 count가 0이다', () => {
    const result = buildDailyData([], 7, today)
    result.forEach((e) => expect(e.count).toBe(0))
  })
})

// ── buildFaq ─────────────────────────────────────────────────────────────────

describe('buildFaq', () => {
  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(buildFaq([])).toEqual([])
  })

  it('동일한 질문을 하나로 집계한다', () => {
    const convs = [
      { question: '자기소개 해줘' },
      { question: '자기소개 해줘' },
      { question: '자기소개 해줘' },
    ]
    const result = buildFaq(convs)
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(3)
  })

  it('count 내림차순으로 정렬한다', () => {
    const convs = [
      { question: 'A질문' },
      { question: 'B질문' },
      { question: 'B질문' },
      { question: 'C질문' },
      { question: 'C질문' },
      { question: 'C질문' },
    ]
    const result = buildFaq(convs)
    expect(result[0].question).toBe('C질문')
    expect(result[1].question).toBe('B질문')
    expect(result[2].question).toBe('A질문')
  })

  it('기본값으로 상위 5개만 반환한다', () => {
    const convs = Array.from({ length: 10 }, (_, i) => ({ question: `질문${i}` }))
    expect(buildFaq(convs)).toHaveLength(5)
  })

  it('topN 파라미터로 반환 수를 조절한다', () => {
    const convs = Array.from({ length: 10 }, (_, i) => ({ question: `질문${i}` }))
    expect(buildFaq(convs, 3)).toHaveLength(3)
    expect(buildFaq(convs, 10)).toHaveLength(10)
  })

  it('앞 80자로 질문 키를 잘라 그루핑한다', () => {
    const longQ = 'A'.repeat(100)
    const convs = [{ question: longQ }, { question: longQ }]
    const result = buildFaq(convs)
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(2)
  })

  it('질문 앞뒤 공백을 제거하고 그루핑한다', () => {
    const convs = [{ question: '  자기소개  ' }, { question: '자기소개' }]
    const result = buildFaq(convs)
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(2)
  })
})

// ── calcSatisfactionRate ──────────────────────────────────────────────────────

describe('calcSatisfactionRate', () => {
  it('피드백이 없으면 null을 반환한다', () => {
    expect(calcSatisfactionRate([])).toBeNull()
    expect(calcSatisfactionRate([{ feedback: null }])).toBeNull()
  })

  it('전원 긍정이면 100을 반환한다', () => {
    const convs = [{ feedback: 1 }, { feedback: 1 }, { feedback: 1 }]
    expect(calcSatisfactionRate(convs)).toBe(100)
  })

  it('전원 부정이면 0을 반환한다', () => {
    const convs = [{ feedback: -1 }, { feedback: -1 }]
    expect(calcSatisfactionRate(convs)).toBe(0)
  })

  it('반반이면 50을 반환한다', () => {
    const convs = [{ feedback: 1 }, { feedback: -1 }]
    expect(calcSatisfactionRate(convs)).toBe(50)
  })

  it('3개 중 2개 긍정이면 67을 반환한다', () => {
    const convs = [{ feedback: 1 }, { feedback: 1 }, { feedback: -1 }]
    expect(calcSatisfactionRate(convs)).toBe(67)
  })

  it('피드백 없는 대화는 분모에서 제외한다', () => {
    const convs = [{ feedback: 1 }, { feedback: null }, { feedback: null }]
    expect(calcSatisfactionRate(convs)).toBe(100)
  })

  it('결과를 정수로 반올림한다', () => {
    // 1/3 ≈ 33.33...
    const convs = [{ feedback: 1 }, { feedback: -1 }, { feedback: -1 }]
    const rate = calcSatisfactionRate(convs)
    expect(Number.isInteger(rate)).toBe(true)
    expect(rate).toBe(33)
  })
})
