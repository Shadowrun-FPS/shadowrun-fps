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
