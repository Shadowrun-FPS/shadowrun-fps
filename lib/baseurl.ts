const env = process.env.NODE_ENV;
export const BASE_URL =
  env == "development"
    ? "http://localhost:3000"
    : "https://" + process.env.NEXT_PUBLIC_VERCEL_URL
    ;
