import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your Chase The Pulls account, view order history, and update your profile settings.",
  robots: { index: false, follow: false },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}


