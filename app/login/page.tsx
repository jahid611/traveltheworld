import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in — TRAVELTHEWORLD",
  description: "Log back in and pick up your journeys where you left off.",
};

export default function LoginPage() {
  return (
    <main className="grid h-dvh grid-cols-1 overflow-y-auto bg-white md:grid-cols-2">
      {/* Hero — photoreal Earth from space */}
      <section className="relative hidden overflow-hidden bg-[#05070d] md:block">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-90"
          style={{ backgroundImage: "url('/textures/earth_day.jpg')" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070d]/80 via-[#05070d]/15 to-[#05070d]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/95">
              <span className="h-3.5 w-3.5 rounded-full bg-sun" />
            </span>
            <span className="text-lg font-medium tracking-tight text-white">
              Travel the World
            </span>
          </div>
          <div>
            <h1 className="display text-4xl leading-tight text-white lg:text-5xl">
              The whole world,
              <br />
              pinned to your memories.
            </h1>
            <p className="mt-4 max-w-md text-white/70">
              Drop a pin anywhere on an interactive globe, attach your photos and
              clips, and relive every journey.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 md:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sun">
              <span className="h-3 w-3 rounded-full bg-white" />
            </span>
            <span className="text-lg font-medium text-fg">Travel the World</span>
          </div>

          <h2 className="text-2xl font-normal text-fg">Sign in</h2>
          <p className="mt-1 mb-6 text-sm text-mute">
            Welcome back — continue your atlas.
          </p>

          <LoginForm />

          <p className="mt-6 text-sm text-mute">
            New here?{" "}
            <Link href="/signup" className="font-medium text-sun hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
