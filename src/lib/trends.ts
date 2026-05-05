import { supabase } from './supabase';
import type { Trend, VoteType, Comment } from '../types';

export interface TrendRow {
  id: string;
  title: string;
  hashtag: string;
  description: string;
  image_url: string;
  ai_comment: string;
  created_at: string;
  category: string;
  views: number;
  votes_yes: number;
  votes_no: number;
  votes_maybe: number;
}

export function rowToTrend(row: TrendRow): Trend {
  return {
    id: row.id,
    title: row.title,
    hashtag: row.hashtag,
    description: row.description,
    image_url: row.image_url,
    ai_comment: row.ai_comment,
    created_at: row.created_at,
    category: row.category as Trend['category'],
    views: row.views ?? 0,
    votes: { yes: row.votes_yes, no: row.votes_no, maybe: row.votes_maybe },
  };
}

export async function fetchTrends(): Promise<Trend[]> {
  const { data, error } = await supabase
    .from('trends')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as TrendRow[]).map(rowToTrend);
}

export async function incrementViews(trendId: string): Promise<void> {
  await supabase.rpc('increment_views', { p_trend_id: trendId });
}

export async function castVote(trendId: string, voteType: VoteType): Promise<void> {
  const { error } = await supabase.rpc('increment_vote', {
    p_trend_id: trendId,
    p_vote_type: voteType,
  });
  if (error) throw error;
}

export async function changeVote(trendId: string, oldVote: VoteType, newVote: VoteType): Promise<void> {
  const { error } = await supabase.rpc('change_vote', {
    p_trend_id: trendId,
    p_old_vote: oldVote,
    p_new_vote: newVote,
  });
  if (error) throw error;
}

export async function likeTrend(trendId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc('like_trend', { p_trend_id: trendId });
}

export async function unlikeTrend(trendId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc('unlike_trend', { p_trend_id: trendId });
}

export async function removeVote(trendId: string, voteType: VoteType): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('decrement_vote', {
    p_trend_id: trendId,
    p_vote_type: voteType,
  });
  if (error) throw error;
}

export async function fetchCommentCount(trendId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('trend_id', trendId);
  if (error) return 0;
  return count ?? 0;
}

export async function fetchComments(trendId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('trend_id', trendId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  const rows = data as (Comment & { user_id: string | null })[];

  const userIds = [...new Set(rows.map((c) => c.user_id).filter(Boolean))] as string[];
  let profileMap: Record<string, { nickname: string | null; avatar_url: string | null }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .in('id', userIds);
    if (profiles) {
      profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
    }
  }

  return rows.map((c) => ({
    ...c,
    nickname: c.user_id ? (profileMap[c.user_id]?.nickname ?? null) : null,
    avatar_url: c.user_id ? (profileMap[c.user_id]?.avatar_url ?? null) : null,
  }));
}

export async function addComment(trendId: string, content: string): Promise<Comment> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('comments')
    .insert({ trend_id: trendId, content, user_id: user?.id ?? null })
    .select()
    .single();

  if (error) throw error;

  let nickname: string | null = null;
  let avatar_url: string | null = null;
  if (user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('id', user.id)
      .single();
    nickname = profile?.nickname ?? null;
    avatar_url = profile?.avatar_url ?? null;
  }

  return { ...(data as Comment), nickname, avatar_url };
}
