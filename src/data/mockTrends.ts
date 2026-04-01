import type { Trend } from '../types';

export const mockTrends: Trend[] = [
  {
    id: '1',
    title: '무지출 챌린지',
    hashtag: '#무지출챌린지',
    description: '하루 동안 돈을 한 푼도 쓰지 않는 챌린지. SNS에서 인증샷이 급증 중이라는데...',
    image_url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80',
    ai_comment: '요즘 피드에서 엄청 보이던데? 이거 진짜 유행 맞아? 🤔',
    created_at: '2026-04-01',
    votes: { yes: 142, no: 38, maybe: 61 },
  },
  {
    id: '2',
    title: '수면 카페',
    hashtag: '#수면카페',
    description: '낮잠을 자러 카페에 간다? 조용하고 어두운 분위기의 수면 특화 카페가 뜨고 있다고 한다.',
    image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
    ai_comment: '나는 카페 가면 커피 마시는데... 이제 자러 가는 거야?? 😴',
    created_at: '2026-04-01',
    votes: { yes: 89, no: 54, maybe: 97 },
  },
  {
    id: '3',
    title: '디지털 디톡스 여행',
    hashtag: '#디지털디톡스',
    description: '스마트폰 없이 떠나는 여행. 오히려 SNS에서 인증하는 아이러니한 트렌드.',
    image_url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80',
    ai_comment: '폰 없이 여행 간 걸 폰으로 올린다고?! 이게 맞아?! 🤯',
    created_at: '2026-04-01',
    votes: { yes: 201, no: 112, maybe: 44 },
  },
];
