export interface NewVideoType {
  user_id: string;
  description: string;
  video_url: string;
  title: string;
}

export interface VideoType extends NewVideoType {
  id: string;
}
