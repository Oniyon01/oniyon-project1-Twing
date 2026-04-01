export interface Trend {
  id: string;
  title: string;
  hashtag: string;
  description: string;
  image_url: string;
  ai_comment: string;
  created_at: string;
  votes: {
    yes: number;
    no: number;
    maybe: number;
  };
}

export type VoteType = 'yes' | 'no' | 'maybe';
