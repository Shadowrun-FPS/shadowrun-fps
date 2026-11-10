import { normalizeImageUrl } from "@/lib/post-display";
import { toCalendarDay } from "@/lib/post-date";
import type { Post, PostFormValues } from "@/types";

export const POST_LIMITS = {
  title: 200,
  description: 5000,
  imageUrl: 500,
  link: 500,
  author: 100,
} as const;

export type PostFormErrors = Partial<Record<keyof PostFormValues, string>>;

const HTTP_URL_PATTERN = /^https?:\/\/.+\..+/;
const IMAGE_URL_PATTERN = /^(https?:\/\/.+\..+|\/.+)$/;

export function getInitialPostFormValues(
  initialPost: Post | undefined,
  defaultAuthor: string
): PostFormValues {
  return {
    title: initialPost?.title ?? "",
    description: initialPost?.description ?? "",
    imageUrl: initialPost?.imageUrl ?? "",
    type: initialPost?.type ?? "EVENT",
    link: initialPost?.link ?? "",
    author: initialPost?.author ?? defaultAuthor,
  };
}

export function validatePostForm(values: PostFormValues): PostFormErrors {
  const errors: PostFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required";
  } else if (values.title.length > POST_LIMITS.title) {
    errors.title = `Title must be ${POST_LIMITS.title} characters or less`;
  }

  if (!values.description.trim()) {
    errors.description = "Description is required";
  } else if (values.description.length > POST_LIMITS.description) {
    errors.description = "Description must be 5,000 characters or less";
  }

  if (!values.imageUrl.trim()) {
    errors.imageUrl = "Add a cover image";
  } else if (values.imageUrl.length > POST_LIMITS.imageUrl) {
    errors.imageUrl = `Image URL must be ${POST_LIMITS.imageUrl} characters or less`;
  } else if (!IMAGE_URL_PATTERN.test(normalizeImageUrl(values.imageUrl))) {
    errors.imageUrl = "Enter a valid image URL or a path starting with /";
  }

  if (values.link) {
    if (!HTTP_URL_PATTERN.test(values.link)) {
      errors.link = "Enter a valid URL starting with http:// or https://";
    } else if (values.link.length > POST_LIMITS.link) {
      errors.link = `Link must be ${POST_LIMITS.link} characters or less`;
    }
  }

  if (!values.author.trim()) {
    errors.author = "Author is required";
  } else if (values.author.length > POST_LIMITS.author) {
    errors.author = `Author must be ${POST_LIMITS.author} characters or less`;
  }

  return errors;
}

/** The post as readers would see it, built from unsaved form values. */
export function buildPreviewPost(values: PostFormValues, date: Date): Post {
  const calendarDay = toCalendarDay(date);
  return {
    _id: "preview",
    title: values.title.trim() || "Untitled post",
    description: values.description,
    imageUrl: values.imageUrl,
    type: values.type,
    link: values.link,
    author: values.author.trim() || "Unknown",
    authorId: "",
    date: calendarDay,
    datePublished: calendarDay,
    published: true,
    order: 0,
  };
}

export function arePostFormValuesEqual(
  first: PostFormValues,
  second: PostFormValues
): boolean {
  return (Object.keys(first) as (keyof PostFormValues)[]).every(
    (key) => first[key] === second[key]
  );
}
