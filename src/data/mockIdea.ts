import type { IdeaInput, VariantsResult, DeepAnalysis } from '../types';

export const MOCK_IDEA_INPUT: IdeaInput = {
  core_idea: '할머니 옷장에서 꺼낸 빈티지 패션',
  emotion_tone: '웃김',
  participation: '챌린지',
  differentiator: '할머니가 직접 출연해서 스타일링 해줌',
};

export const MOCK_VARIANTS: VariantsResult = {
  idea_id: 'demo-idea-id',
  detected_flavor: '레트로·빈티지 커뮤니티',
  inferred_differentiator: '실제 할머니 등장 — 연출이 아닌 진짜 이야기',
  variants: [
    {
      angle: '자학형 유머',
      challenge_name: '할머니옷장털기챌린지',
      hashtags: ['#할머니패션', '#빈티지코디', '#Y2K할머니'],
      wingle_comment: '할머니 니트 조끼가 요즘 명품보다 비싼 거 알지? 😎',
      caption_hook: '할머니 옷장에서 이걸 발견했을 때 내 표정...',
      variation_seed: '발견 아이템을 매주 교체 — 다음 편이 기다려지는 구조',
    },
    {
      angle: '감성 역주행',
      challenge_name: '할머니와나코디대결',
      hashtags: ['#레트로룩', '#세대초월코디', '#할머니스타일'],
      wingle_comment: '이거 그냥 패션쇼 아니야? 할머니한테 지는 거 맞음 🥹',
      caption_hook: '"이 옷 30년 됐어" — 그게 더 힙한 이유',
      variation_seed: '할머니 VS 손녀 투표로 확산 유도',
    },
    {
      angle: '충격·반전',
      challenge_name: '할머니가스타일링해줌챌린지',
      hashtags: ['#옷장챌린지', '#할비코어', '#레트로패션'],
      wingle_comment: '이 할머니 패션 감각이 나보다 나은 거 실화? 💀',
      caption_hook: '30년 전 옷이 지금 더 힙한 이유',
      variation_seed: '"내 할머니도 해봤어요" UGC 태그 루프',
    },
  ],
};

export const MOCK_DEEP_ANALYSIS: DeepAnalysis = {
  idea_id: 'demo-idea-id',
  why_it_works: {
    core_mechanism: '진짜 할머니 등장이라는 예상 밖 소재 + 빈티지 실물 아이템이 주는 희소성이 공유 욕구를 자극함',
    similar_success: [
      { name: '할비코어 챌린지', year: 2024, scale: '틱톡 1.2M+ 뷰' },
      { name: '그래니 스타일 트렌드', year: 2024, scale: '인스타 #grannystyle 8M+ 게시물' },
    ],
  },
  platform_plans: {
    tiktok: {
      priority: 'high',
      core_tactic: '할머니 등장 첫 3초 + 자막 "이 옷 몇 년 된 줄 알아?"로 완주율 극대화',
      first_3_seconds: '할머니가 옷장 문 여는 장면 클로즈업 — 말 없이',
      loop_point: '마지막 프레임을 첫 장면처럼 연결 — "다음은 뭐가 나올까" 루프',
      search_keywords: ['할머니패션', '빈티지코디챌린지', '할비코어'],
      best_timing: '금요일 오후 7–9시',
    },
    instagram_reels: {
      priority: 'high',
      core_tactic: '캐러셀로 아이템 하나씩 공개 + 마지막에 할머니 등장 반전',
      alt_text_suggestion: '할머니 빈티지 옷장에서 꺼낸 Y2K 니트 조끼 코디',
      format_choice: 'reel + carousel 복합 — 릴스로 후킹 후 캐러셀 저장 유도',
      best_timing: '토요일 오전 10–11시',
    },
    youtube_shorts: {
      priority: 'low',
      core_tactic: '단편 미니 시리즈로 운영 — "할머니 옷장 시즌1" 형태',
      title_formula: '"할머니 옷장에서 [아이템] 발굴했더니 [반전]"',
      thumbnail_concept: '할머니 + 손녀 나란히 같은 옷 입은 장면',
      best_timing: '주중 낮 12–2시',
    },
  },
  recommended_platform: 'tiktok',
  scale_playbook: {
    type: 'ugc_expansion',
    stage_1: '할머니 등장 첫 영상 올리기 — 캡션에 "#할머니옷장털기챌린지" 태그 심기',
    stage_2: '조회 500 넘으면 "이 아이템 몇 년 됐을까요?" 댓글 유도 + DM 공유 독려',
    stage_3: '"우리 할머니도 했어요" 태그 영상이 올라오기 시작 — 베스트 리포스팅으로 UGC 불씨 유지',
    stage_4: '패션 브랜드 콜라보 제안 or 방송·뉴스 픽업 — "할머니가 스타일 선생님" 스토리라인으로 확장',
  },
  why_it_might_fail: {
    saturation_risk: 5,
    outdated_patterns: ['할비코어(2023)', '그래니 쇼핑 브이로그'],
    execution_difficulty: '실제 할머니 섭외 및 촬영 동의 필요 — 가족이 아니면 진입 장벽 높음',
    ethical_note: null,
  },
  how_to_win: {
    differentiator: '할머니가 직접 "이건 이렇게 입어야 해" 스타일링 지시하는 장면 — 연출이 아닌 날것의 캐릭터가 핵심',
    pitfalls_to_avoid: [
      '과하게 연출하면 "광고 같아" 반응 나옴 — 핸드헬드 촬영이 오히려 더 진짜같이 보임',
      '해시태그 10개 이상 붙이지 말 것 — 맥락 2–3개가 알고리즘에 더 유리',
      '첫 영상부터 완성도 욕심 부리지 말 것 — 날것 느낌이 이 소재의 강점',
    ],
  },
  wingle_honest_verdict: {
    score: 7,
    one_liner: '할머니만 진짜면 진짜 터짐. 연출하면 끝남 😎',
  },
};
