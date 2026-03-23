import Link from "next/link"
import { KeyRound, Terminal, LogIn, Package } from "lucide-react"

export const metadata = {
  title: "Admin setup | Chase The Pulls",
  description: "How to sign in and add products",
}

export default function SetupAdminPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="font-display font-bold text-3xl text-white mb-2">Store admin</h1>
        <p className="text-white/50 text-sm mb-10">
          Add products from the dashboard after you have an admin account.
        </p>

        <ol className="space-y-8 text-white/80 text-sm">
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold font-mono text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-white mb-1 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gold" />
                Create the admin user (one time)
              </p>
              <p className="text-white/55 mb-2">
                In <code className="text-gold/90">.env.local</code>, set:
              </p>
              <pre className="rounded-lg border border-surface-border bg-surface/80 p-3 text-xs text-white/70 overflow-x-auto whitespace-pre-wrap">
                ADMIN_EMAIL=&quot;your@email.com&quot;{"\n"}
                ADMIN_PASSWORD=&quot;your-secure-password&quot;
              </pre>
              <p className="text-white/55 mt-2">
                Then in the project folder run:
              </p>
              <pre className="rounded-lg border border-surface-border bg-surface/80 p-3 text-xs text-gold/90">
                npm run admin:add
              </pre>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold font-mono text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-white mb-1 flex items-center gap-2">
                <LogIn className="w-4 h-4 text-gold" />
                Sign in
              </p>
              <p className="text-white/55 mb-3">
                Use that same email and password on the login page.
              </p>
              <Link
                href="/login?callbackUrl=/admin/products/new"
                className="inline-flex items-center gap-2 text-gold hover:text-gold-light text-sm font-medium"
              >
                Go to login →
              </Link>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold font-mono text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-white mb-1 flex items-center gap-2">
                <Package className="w-4 h-4 text-gold" />
                Add products
              </p>
              <p className="text-white/55 mb-3">
                Open the admin products page and create a new product (upload images there).
              </p>
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-2 text-gold hover:text-gold-light text-sm font-medium"
              >
                New product (must be signed in as admin) →
              </Link>
            </div>
          </li>
        </ol>

        <div className="mt-12 rounded-xl border border-surface-border bg-surface/40 p-4 flex gap-3 text-xs text-white/45">
          <KeyRound className="w-5 h-5 text-gold shrink-0 mt-0.5" />
          <p>
            <span className="text-white/60">Alternative:</span> register with an email that matches{" "}
            <code className="text-white/50">ADMIN_EMAIL</code> in env — that account is created as
            admin automatically. You can still run <code className="text-white/50">npm run admin:add</code>{" "}
            to reset the password.
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-white/35">
          <Link href="/" className="hover:text-white/55">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  )
}
