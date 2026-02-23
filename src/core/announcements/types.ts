export interface Announcement {
  id: string
  community_id: string
  author_id: string
  title: string
  body: string
  priority: 'low' | 'normal' | 'urgent'
  pinned: boolean
  published_at: string
  expires_at: string | null
  created_at: string
  author_name?: string
  read?: boolean
}
