import type { Metadata } from "next";
import Link from "next/link";
import SignUpForm from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "SIGN UP // TRAVELTHEWORLD",
  description: "Create your account on the brutalist 3D globe.",
};

export default function SignUpPage() {
  return (
    <main className="h-dvh overflow-y-auto bg-ink">
      <div className="grid min-h-full grid-cols-1 md:grid-cols-2">
        {/* Brand block */}
        <section className="flex flex-col justify-between gap-10 border-b border-line p-6 md:border-r md:border-b-0 md:p-12">
          <p className="label">TRAVELTHEWORLD // ENROLL</p>
          <h1 className="text-6xl leading-[0.9] font-bold tracking-tighter uppercase sm:text-7xl lg:text-8xl">
            TRAVEL
            <br />
            THE
            <br />
            <span className="inline-block bg-fg px-3 text-ink">WORLD</span>
          </h1>
          <p className="label">
            PIN YOUR PLACES. ATTACH YOUR MEDIA. OWN YOUR DATA.
          </p>
        </section>

        {/* Form block */}
        <section className="flex items-center justify-center p-6 md:p-12">
          <div className="panel hard-shadow w-full max-w-md p-6">
            <div className="mb-6 flex items-baseline justify-between border-b border-line pb-4">
              <h2 className="text-sm font-bold tracking-[0.2em] uppercase">
                SIGN UP
              </h2>
              <span className="label">02 / AUTH</span>
            </div>

            <SignUpForm />

            <div className="mt-6 border-t border-line pt-4">
              <Link href="/login" className="label hover:text-fg">
                {"HAVE AN ACCOUNT -> LOG IN"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
