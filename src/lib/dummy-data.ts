import type { Persona } from '@/lib/types'

export const DUMMY_PERSONA: Persona = {
  username: 'demo',
  name: '김민준',
  title: 'Frontend Engineer @ Kakao',
  bio: '사용자 경험을 최우선으로 생각하는 프론트엔드 개발자입니다.',
  photoUrl: '/dummy/profile.jpg',
  suggestedQuestions: [
    '주요 프로젝트를 소개해줘',
    '협업 스타일이 어때?',
    '가장 자신 있는 기술 스택은?',
    '개발자로서의 강점이 뭐야?',
    '앞으로의 커리어 방향은?',
  ],
  personaPreset: 'friendly',
}

// 더미 답변 생성 (Phase 4 전까지 사용)
export function getDummyAnswer(question: string): string {
  const answers: Record<string, string> = {
    '주요 프로젝트를 소개해줘':
      '안녕하세요! 저는 카카오에서 당근마켓 클론 프로젝트와 AI 챗봇 SaaS를 주로 작업했어요. 특히 AI 챗봇 프로젝트에서는 React와 Next.js를 활용해 실시간 스트리밍 UI를 구현했고, 월 활성 사용자 10만 명을 달성했습니다.',
    '협업 스타일이 어때?':
      '저는 코드 리뷰를 굉장히 중요하게 생각해요. PR을 올릴 때 꼼꼼한 설명을 달고, 동료 코드를 리뷰할 때는 건설적인 피드백을 주려고 노력합니다. 또한 주 2회 팀 싱크를 통해 업무 진행상황을 공유하는 것을 선호합니다.',
    '가장 자신 있는 기술 스택은?':
      'React와 TypeScript가 가장 자신 있습니다. 특히 Next.js App Router와 Server Components를 깊이 있게 다뤄봤고, 성능 최적화(Core Web Vitals)에 관심이 많습니다. 최근에는 GraphQL과 Supabase를 활용한 풀스택 개발도 즐기고 있어요.',
  }

  return (
    answers[question] ||
    `"${question}"에 대한 답변입니다. 저는 이 질문을 굉장히 중요하게 생각하는데요, 실제 데이터가 연동되면 더 정확한 답변을 드릴 수 있을 것 같습니다. (더미 응답)`
  )
}
