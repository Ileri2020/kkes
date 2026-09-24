interface NewCommentType {
  content: string;
  user_id: string;
  video_id: string;
  created_at?: string;
}

interface CommentType extends NewCommentType {
  id: string;
}
