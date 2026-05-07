import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication Error",
  description: "An error occurred during sign-in. Please try again.",
  alternates: {
    canonical: "/auth/error",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function AuthErrorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

