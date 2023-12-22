const env = process.env.NODE_ENV;
export const BASE_URL =
  env == "development"
    ? "http://localhost:3000"
    : process.env.VERCEL_URL;
