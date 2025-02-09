import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createGetURL(
  apiEndpoint: string,
  requestParams: { [key: string]: any }
) {
  const baseUrl = getApiUrl() + apiEndpoint;
  const url = new URL(baseUrl);

  const params = new URLSearchParams(requestParams);

  url.search = params.toString();
  return url.toString();
}

export function getApiUrl() {
  // console.log("getApiUrl", process.env);
  const env = process.env.NODE_ENV;
  if (env === "development") {
    return `http://localhost:3000`;
  } else {
    return `https://${process.env.VERCEL_URL}`;
  }
}

export function convertMongoId(document: any) {
  return {
    ...document,
    _id: document._id.toString(),
  };
}

export function formatDate(dateString: string): string {
  // Ensure consistent timezone handling by explicitly using UTC
  const date = new Date(dateString + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    timeZone: "UTC", // Ensure UTC timezone
  });
}
