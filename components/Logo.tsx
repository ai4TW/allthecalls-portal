export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative h-9 w-9">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan shadow-lg shadow-accent-violet/30" />
        <div className="absolute inset-[2px] rounded-[10px] bg-bg-base flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="url(#g1)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <path d="M3 5a2 2 0 012-2h2.3a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.21l-1.7.85a11 11 0 005.52 5.52l.85-1.7a1 1 0 011.21-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
          </svg>
        </div>
      </div>
      <div className="leading-tight">
        <div className="font-semibold text-ink">AllTheCalls</div>
        <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute">Portal</div>
      </div>
    </div>
  );
}
