import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in — TRAVELTHEWORLD",
  description: "Log back in and pick up your journeys where you left off.",
};

export default function LoginPage() {
  return (
    <main className="app-bg h-dvh overflow-y-auto">
      <div className="grid min-h-full grid-cols-1 md:grid-cols-2">
        {/* Brand block */}
        <section className="flex flex-col justify-between gap-10 border-b border-line p-6 md:border-r md:border-b-0 md:p-12">
          <p className="label">Travel the world · Access</p>
          <div>
            <h1 className="display text-6xl uppercase sm:text-7xl lg:text-8xl">
              Travel
              <br />
              The
              <br />
              <span className="accent-sun mt-1 inline-block px-3 pb-1">
                World
              </span>
            </h1>
            <p className="mt-6 max-w-sm font-display text-lg text-mute italic">
              Every pin is a memory. Drop them across the globe and relive the
              journey.
            </p>
          </div>
          <p className="label">Pin your places · Attach your media · Own your data</p>
        </section>

        {/* Form block */}
        <section className="flex items-center justify-center p-6 md:p-12">
          <div className="panel lift w-full max-w-md p-7">
            <div className="mb-6 flex items-baseline justify-between border-b border-line pb-4">
              <h2 className="font-display text-2xl font-semibold">Welcome back</h2>
              <span className="label">01 · Auth</span>
            </div>

            <LoginForm />

            <div className="mt-6 border-t border-line pt-4">
              <Link
                href="/signup"
                className="text-xs font-semibold tracking-wide text-mute uppercase transition-colors hover:text-sun"
              >
                {"No account yet? → Sign up"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
