export type PersonaPreset = 'professional' | 'friendly' | 'challenger'

export type Theme = 'default' | 'tech' | 'creative' | 'business'

export type Citation = {
  index: number
  title: string
  excerpt: string
  url: string | null
  source?: 'vector' | 'graph'
}

/** Visitor 페이지에서 사용하는 공개 프로필 (User의 뷰 모델) */
export type Persona = {
  username: string
  name: string
  title: string
  bio: string
  photoUrl: string | null
  suggestedQuestions: string[]
  personaPreset: PersonaPreset
  theme: Theme
}

/** 방문자가 설정하는 인터뷰어 설정 (클라이언트 상태, camelCase) */
export type InterviewerConfig = {
  answerLength: 'short' | 'medium' | 'long'
  language: 'ko' | 'en'
  speechStyle: 'formal' | 'casual'
  questionStyle: 'free' | 'interview' | 'chat'
  showCitation: boolean
}

export type DefaultInterviewer = {
  answer_length: 'short' | 'medium' | 'long'
  language: 'ko' | 'en'
  speech_style: 'formal' | 'casual'
  question_style: 'free' | 'interview' | 'chat'
  show_citation: boolean
}

export type PersonaConfig = {
  preset: PersonaPreset
  custom_prompt: string
  default_interviewer: DefaultInterviewer
  suggested_questions: string[]
}

export type User = {
  id: string
  auth_id: string | null
  username: string
  name: string
  title: string
  bio: string
  photo_url: string | null
  persona_config: PersonaConfig
  theme?: Theme
  created_at: string
  updated_at: string
}

export type PinnedQA = {
  id: string
  user_id: string
  question: string
  answer: string
  display_order: number
  created_at: string
  updated_at: string
}

export type DocumentType = 'pdf' | 'url' | 'github' | 'linkedin' | 'other'
export type DocumentStatus = 'pending' | 'processing' | 'done' | 'error'

export type Document = {
  id: string
  user_id: string
  type: DocumentType
  title: string
  source_url: string | null
  content: string
  status: DocumentStatus
  error_message: string | null
  created_at: string
}
