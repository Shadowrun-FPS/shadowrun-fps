import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to Shadowrun FPS with your Discord account.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

