import type { PersonaConfig, InterviewerConfig } from './types'

export const DEMO_USERNAME = 'demo'

export const DEFAULT_INTERVIEWER_CONFIG: InterviewerConfig = {
  answerLength: 'medium',
  language: 'ko',
  speechStyle: 'formal',
  questionStyle: 'free',
  showCitation: true,
}

export const DEFAULT_PERSONA_CONFIG: PersonaConfig = {
  preset: 'professional',
  custom_prompt: '',
  default_interviewer: {
    answer_length: 'medium',
    language: 'ko',
    speech_style: 'formal',
    question_style: 'free',
    show_citation: true,
  },
  suggested_questions: [
    '주요 프로젝트를 소개해줘',
    '협업 스타일이 어때?',
    '가장 자신 있는 기술 스택은?',
  ],
}
