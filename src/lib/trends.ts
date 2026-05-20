import { supabase } from './supabase';
import type { Trend, VoteType, Comment } from '../types';

// ideas 테이블 행 타입
export interface IdeaRow {
  id: string;
  user_id: string;
  core_idea: string;
  category: string;
  variants: Array<{
    angle: string;
    challenge_name: string;
    hashtags: string[];
    wingle_comment: string;
    caption_hook: string;
    variation_seed: string;
  }>;
  selected_variant_index: number | null;
  try_vote_count: number;
  watch_vote_count: number;
  like_count: number;
  comment_count: number;
  hot_score: number;
  created_at: string;
  shared_at: string | null;
}

// IdeaRow → Trend 변환 (피드 표시용)
export function rowToTrend(row: IdeaRow): Trend {
  const idx = row.selected_variant_index ?? 0;
  const variant = row.variants?.[idx];
  return {
    id: row.id,
    user_id: row.user_id,
    title: variant?.challenge_name ?? row.core_idea,
    hashtag: variant?.hashtags?.[0] ?? '',
    description: row.core_idea,
    image_url: '',
    ai_comment: variant?.wingle_comment ?? '',
    created_at: row.shared_at ?? row.created_at,
    category: row.category as Trend['category'],
    views: 0,
    votes: { yes: row.try_vote_count, no: 0, maybe: row.watch_vote_count },
    likes_count: row.like_count,
    is_seed: false,
  };
}

// 피드 데이터 — is_shared=true 인 ideas만 조회
export async function fetchTrends(): Promise<Trend[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select('id, user_id, core_idea, category, variants, selected_variant_index, try_vote_count, watch_vote_count, like_count, comment_count, hot_score, created_at, shared_at')
    .eq('is_shared', true)
    .eq('is_hidden', false)
    .order('hot_score', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as IdeaRow[]).map(rowToTrend);
}

// 조회수 — ideas 테이블에 views 컬럼 없음, 현재는 no-op
export async function incrementViews(_ideaId: string): Promise<void> {}

// 투표 — feedbacks 테이블 INSERT
// VoteType 'yes'→'try', 'maybe'→'watch', 'no'→저장 안 함(새 스키마에 없음)
function toFeedbackVoteType(v: VoteType): 'try' | 'watch' | null {
  if (v === 'yes') return 'try';
  if (v === 'maybe') return 'watch';
  return null;
}

export async function castVote(ideaId: string, voteType: VoteType): Promise<void> {
  const dbType = toFeedbackVoteType(voteType);
  if (!dbType) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('feedbacks')
    .insert({ idea_id: ideaId, user_id: user.id, vote_type: dbType });
  if (error) throw error;
}

export async function changeVote(ideaId: string, _oldVote: VoteType, newVote: VoteType): Promise<void> {
  const dbType = toFeedbackVoteType(newVote);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (!dbType) {
    // 새 vote가 'no'면 기존 vote 삭제
    await supabase.from('feedbacks').delete().eq('idea_id', ideaId).eq('user_id', user.id);
    return;
  }
  const { error } = await supabase
    .from('feedbacks')
    .update({ vote_type: dbType })
    .eq('idea_id', ideaId)
    .eq('user_id', user.id);
  if (error) throw error;
}

export async function removeVote(ideaId: string, _voteType: VoteType): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('feedbacks')
    .delete()
    .eq('idea_id', ideaId)
    .eq('user_id', user.id);
  if (error) throw error;
}

// 좋아요 — likes 테이블
export async function likeTrend(ideaId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('likes').insert({ idea_id: ideaId, user_id: user.id });
}

export async function unlikeTrend(ideaId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('likes').delete().eq('idea_id', ideaId).eq('user_id', user.id);
}

// 댓글 — comments 테이블 (idea_id 기반)
export async function fetchCommentCount(ideaId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('idea_id', ideaId);
  if (error) return 0;
  return count ?? 0;
}

export async function fetchComments(ideaId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, idea_id, content, created_at, user_id, users(username, avatar_url)')
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    trend_id: row.idea_id,   // Comment 타입 호환을 위해 trend_id 필드 유지
    content: row.content,
    created_at: row.created_at,
    user_id: row.user_id ?? null,
    nickname: row.users?.username ?? null,
    avatar_url: row.users?.avatar_url ?? null,
  }));
}

export async function addComment(ideaId: string, content: string): Promise<Comment> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('comments')
    .insert({ idea_id: ideaId, content, user_id: user?.id ?? null })
    .select('id, idea_id, content, created_at, user_id')
    .single();

  if (error) throw error;

  let nickname: string | null = null;
  let avatar_url: string | null = null;
  if (user?.id) {
    const { data: profile } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();
    nickname = profile?.username ?? null;
    avatar_url = profile?.avatar_url ?? null;
  }

  return {
    id: data.id,
    trend_id: data.idea_id,
    content: data.content,
    created_at: data.created_at,
    user_id: data.user_id ?? null,
    nickname,
    avatar_url,
  };
}
