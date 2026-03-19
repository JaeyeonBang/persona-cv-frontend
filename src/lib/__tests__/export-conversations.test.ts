import { describe, it, expect } from 'vitest'
import { conversationsToCsv } from '../export-conversations'
import type { ConversationRow } from '../history-analytics'

function makeRow(overrides: Partial<ConversationRow> = {}): ConversationRow {
  return {
    id: '1',
    session_id: 'sess',
    question: '질문',
    answer: '답변',
    feedback: null,
    is_cached: false,
    created_at: '2026-03-18T10:00:00Z',
    ...overrides,
  }
}

describe('conversationsToCsv', () => {
  it('빈 배열이면 헤더만 반환', () => {
    const csv = conversationsToCsv([])
    expect(csv).toBe('날짜,질문,답변,피드백')
  })

  it('헤더 행이 첫 번째 줄에 있다', () => {
    const csv = conversationsToCsv([makeRow()])
    const lines = csv.split('\n')
    expect(lines[0]).toBe('날짜,질문,답변,피드백')
  })

  it('데이터가 1행이면 헤더+1줄', () => {
    const csv = conversationsToCsv([makeRow()])
    expect(csv.split('\n')).toHaveLength(2)
  })

  it('데이터가 3행이면 헤더+3줄', () => {
    const rows = [makeRow({ id: '1' }), makeRow({ id: '2' }), makeRow({ id: '3' })]
    expect(conversationsToCsv(rows).split('\n')).toHaveLength(4)
  })

  it('긍정 피드백은 👍로 표시된다', () => {
    const csv = conversationsToCsv([makeRow({ feedback: 1 })])
    expect(csv).toContain('👍')
  })

  it('부정 피드백은 👎로 표시된다', () => {
    const csv = conversationsToCsv([makeRow({ feedback: -1 })])
    expect(csv).toContain('👎')
  })

  it('피드백 없으면 빈 문자열', () => {
    const csv = conversationsToCsv([makeRow({ feedback: null })])
    const dataLine = csv.split('\n')[1]
    expect(dataLine.endsWith('""')).toBe(true)
  })

  it('쌍따옴표를 이스케이프한다', () => {
    const csv = conversationsToCsv([makeRow({ question: '그는 "안녕"이라고 했다' })])
    expect(csv).toContain('"그는 ""안녕""이라고 했다"')
  })

  it('각 필드가 쌍따옴표로 감싸져 있다', () => {
    const csv = conversationsToCsv([makeRow({ question: '테스트', answer: '응답' })])
    const dataLine = csv.split('\n')[1]
    const cols = dataLine.split('","')
    expect(cols.length).toBeGreaterThanOrEqual(3)
  })

  it('질문과 답변이 CSV에 포함된다', () => {
    const csv = conversationsToCsv([makeRow({ question: '자기소개', answer: '저는 개발자입니다' })])
    expect(csv).toContain('자기소개')
    expect(csv).toContain('저는 개발자입니다')
  })
})
