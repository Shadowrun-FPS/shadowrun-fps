export const POST_TYPES = ["EVENT", "NEWS"] as const;

/** Retired type. Stored posts and old links using it are treated as `NEWS`. */
export const LEGACY_ARTICLE_TYPE = "ARTICLE";

export type PostType = (typeof POST_TYPES)[number];

/** Archive filter: every post type or one of them. */
export type PostTypeFilter = "all" | PostType;

/** A post exactly as the API stores and serves it (plain, JSON-safe values). */
export interface Post {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  type: PostType;
  /** Optional external page the card opens. Empty when the post is read in the sheet. */
  link: string;
  author: string;
  authorId: string;
  /** ISO timestamp of the stored date. */
  date: string;
  /** Calendar day (`YYYY-MM-DD`) readers see. Legacy posts hold a full ISO timestamp. */
  datePublished: string;
  published: boolean;
  order: number;
  updatedAt?: string;
}

/** Values the composer submits when creating or editing a post. */
export interface PostFormValues {
  title: string;
  description: string;
  imageUrl: string;
  type: PostType;
  link: string;
  author: string;
}

/** An image already in the media bucket that a post can reuse. */
export interface PostMediaLibraryImage {
  url: string;
  /** ISO timestamp of the upload. */
  uploadedAt: string;
}

export interface PostMediaUploadResult {
  url: string;
}
