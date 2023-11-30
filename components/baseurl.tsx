const env = process.env.NODE_ENV
export const BASE_URL = env == "development" ? process.env.NEXT_PUBLIC_API_URL : "http://" + process.env.VERCEL_URL;

