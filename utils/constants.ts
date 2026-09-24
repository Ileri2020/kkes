import { NewVideoType, VideoType } from "@/types/videoType";

export const BASE_URL =
  "https://take-home-assessment-423502.uc.r.appspot.com/api/videos";

export const headers = { "Content-Type": "application/json" };

export const videoBlank: NewVideoType = {
  video_url: "",
  user_id: "",
  title: "",
  description: "",
};

export const commentBlank: NewCommentType = {
  content: "",
  user_id: "",
  video_id: "",
};
