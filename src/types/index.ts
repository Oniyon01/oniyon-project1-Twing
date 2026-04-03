export interface Trend {
  id: string;
  title: string;
  hashtag: string;
  description: string;
  image_url: string;
  ai_comment: string;
  created_at: string;
  category: Category;
  votes: {
    yes: number;
    no: number;
    maybe: number;
  };
}

export type VoteType = 'yes' | 'no' | 'maybe';

export type Category = 'lifestyle' | 'cafe' | 'travel' | 'challenge' | 'tech';

export interface CategoryMeta {
  key: Category;
  label: string;
  emoji: string;
}
