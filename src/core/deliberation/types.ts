// Deliberation System Types — DL-001..DL-011
// Threaded discussions with sentiment tagging, reactions, and @mentions

export type Sentiment = 'pro' | 'con' | 'neutral' | 'question'

export type ContentFormat = 'plain' | 'markdown'

export type ReactionType = 'agree' | 'disagree' | 'helpful' | 'question'

export interface Attachment {
  name: string
  url: string
  type: string // MIME type
  size: number // bytes
}

export interface MentionRef {
  member_id: string
  member_name: string
}

export interface DiscussionComment {
  id: string
  community_id: string
  proposal_id: string
  parent_comment_id: string | null
  author_id: string
  content: string
  content_format: ContentFormat
  sentiment: Sentiment
  attachments: Attachment[]
  mentions: MentionRef[]
  edited_at: string | null
  deleted_at: string | null
  created_at: string
  // Joined
  author_name?: string
  author_role?: string
  // Computed client-side
  replies?: DiscussionComment[]
  reaction_summary?: ReactionSummary
}

export interface CommentReaction {
  id: string
  comment_id: string
  member_id: string
  reaction: ReactionType
  created_at: string
}

export interface ReactionSummary {
  agree: number
  disagree: number
  helpful: number
  question: number
  user_reactions: ReactionType[] // current user's reactions
}

export interface SentimentSummary {
  pro_count: number
  con_count: number
  neutral_count: number
  question_count: number
  total_count: number
}

export const SENTIMENT_CONFIG: Record<Sentiment, { label: string; color: string; bgColor: string }> = {
  pro: { label: 'A favor', color: 'text-green-700', bgColor: 'bg-green-100' },
  con: { label: 'En contra', color: 'text-red-700', bgColor: 'bg-red-100' },
  neutral: { label: 'Neutral', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  question: { label: 'Pregunta', color: 'text-blue-700', bgColor: 'bg-blue-100' },
}

export const REACTION_CONFIG: Record<ReactionType, { label: string; icon: string }> = {
  agree: { label: 'De acuerdo', icon: 'thumbs-up' },
  disagree: { label: 'En desacuerdo', icon: 'thumbs-down' },
  helpful: { label: 'Util', icon: 'lightbulb' },
  question: { label: 'Pregunta', icon: 'help-circle' },
}
