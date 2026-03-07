import type { User } from '@/lib/types'
import type { InterviewerConfig } from '@/lib/types'
import { env } from '@/lib/env'

const ANSWER_LENGTH_MAP = {
  short: '2~3문장으로 간결하게',
  medium: '5~7문장으로 적당하게',
  long: '충분히 자세하게 (10문장 이상)',
} as const

const SPEECH_STYLE_MAP = {
  formal: '격식체 (합니다/입니다)',
  casual: '반말 (해/야)',
} as const

const QUESTION_STYLE_MAP = {
  free: '자유로운 대화처럼',
  interview: '면접관의 질문에 답하듯 구체적이고 근거를 들어서',
  chat: '친구와 가볍게 대화하듯',
} as const

const PRESET_TONE_MAP = {
  professional: '전문적이고 논리적인 어조',
  friendly: '친근하고 따뜻한 어조',
  challenger: '도전적이고 자신감 있는 어조',
} as const

/**
 * 페르소나 + Interviewer 설정을 바탕으로 시스템 프롬프트를 생성합니다.
 */
export function buildSystemPrompt(user: User, config: InterviewerConfig, context: string): string {
  const { persona_config: pc } = user
  const lang = config.language === 'ko' ? '한국어' : 'English'
  const tone = PRESET_TONE_MAP[pc.preset]
  const speech = SPEECH_STYLE_MAP[config.speechStyle]
  const length = ANSWER_LENGTH_MAP[config.answerLength]
  const style = QUESTION_STYLE_MAP[config.questionStyle]

  const lines = [
    `당신은 ${user.name}입니다.`,
    `직책: ${user.title}`,
    `소개: ${user.bio}`,
    '',
    `## 말투 & 스타일`,
    `- 기본 어조: ${tone}`,
    pc.custom_prompt ? `- 추가 지시: ${pc.custom_prompt}` : null,
    `- 답변 길이: ${length}`,
    `- 말투: ${speech}`,
    `- 질문 스타일: ${style}`,
    `- 답변 언어: ${lang}`,
    '',
    context
      ? `## 참고 자료 (관련 문서에서 발췌)\n${context}\n`
      : '## 참고 자료\n(등록된 문서가 없습니다. 일반 지식으로 답변하세요.)\n',
    '## 지시사항',
    `- 항상 ${user.name} 본인의 입장에서 1인칭으로 답변하세요.`,
    '- 자료에 없는 내용은 지어내지 말고 모른다고 하세요.',
    '- 마크다운 문법은 사용하지 마세요.',
  ].filter((l) => l !== null)

  return lines.join('\n')
}

/**
 * OpenRouter API에 스트리밍 요청을 보냅니다.
 * ReadableStream<string>을 반환합니다.
 */
export async function streamChat(
  systemPrompt: string,
  question: string,
): Promise<ReadableStream<Uint8Array>> {
  if (!env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set')

  const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      stream: true,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter error ${response.status}: ${err}`)
  }

  if (!response.body) throw new Error('No response body')
  return response.body
}

/**
 * OpenRouter SSE 스트림을 텍스트 청크 스트림으로 변환합니다.
 * data: [DONE] 또는 파싱 실패 시 조용히 스킵합니다.
 */
export function parseOpenRouterStream(
  rawStream: ReadableStream<Uint8Array>,
): ReadableStream<string> {
  const decoder = new TextDecoder()
  let buffer = ''

  return new ReadableStream<string>({
    async start(controller) {
      const reader = rawStream.getReader()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const data = trimmed.slice(5).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const text = parsed.choices?.[0]?.delta?.content
              if (text) controller.enqueue(text)
            } catch {
              // 파싱 불가 라인 무시
            }
          }
        }
      } finally {
        reader.releaseLock()
        controller.close()
      }
    },
  })
}
