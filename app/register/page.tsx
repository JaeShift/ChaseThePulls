"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Zap, Chrome } from "lucide-react"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { registerSchema, type RegisterInput } from "@/lib/validations"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast({ title: "Error", description: err.error ?? "Registration failed.", variant: "destructive" })
        return
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.ok) {
        toast({ title: "Welcome to Chase The Pulls!", description: "Account created successfully.", variant: "success" })
        router.push("/")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 pb-8 px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center shadow-lg shadow-gold/30">
              <Zap className="w-6 h-6 text-background fill-background" />
            </div>
            <span className="font-display font-bold text-xl text-white tracking-widest">CTP</span>
          </Link>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Join the hunt</h1>
          <p className="text-white/50">Create your account and start chasing pulls</p>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface p-8 space-y-6">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => { setGoogleLoading(true); signIn("google", { callbackUrl: "/" }) }}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Chrome className="w-5 h-5" />}
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-white/30 px-2">or</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Ash Ketchum" autoComplete="name" {...register("name")} />
              {errors.name && <p className="text-xs text-electric-red">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-xs text-electric-red">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  autoComplete="new-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-electric-red">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className="text-xs text-electric-red">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" variant="glow" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background/50 border-t-background rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : "Create Account"}
            </Button>
          </form>

          <p className="text-xs text-center text-white/30">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-gold hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
          </p>
        </div>

        <p className="text-center text-sm text-white/40 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-gold hover:text-gold-light transition-colors font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}


