import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Chase The Pulls account to view your orders and manage your profile.",
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}


