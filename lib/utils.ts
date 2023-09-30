import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createURL(
  apiEndpoint: string,
  requestParams: { [key: string]: string }
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL + apiEndpoint;
  const url = new URL(baseUrl);

  const params = new URLSearchParams(requestParams);

  url.search = params.toString();
  return url.toString();
}
