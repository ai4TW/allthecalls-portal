import Link from "next/link";
import Logo from "./Logo";
import type { Session } from "@/lib/session";

export default function Nav({ session }: { session: Session }) {
  return (
    <header className="sticky top-0 z-30 border-b border-bg-edge bg-bg-base/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-xs text-ink-mute">Signed in</div>
            <div className="text-sm font-medium text-ink">{session.name}</div>
          </div>
          <form action="/api/logout" method="POST">
            <button className="btn-ghost" type="submit">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
