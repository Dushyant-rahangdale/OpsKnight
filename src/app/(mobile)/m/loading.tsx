import Image from 'next/image';

export default function MobileLoading() {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[color:var(--bg-surface)] backdrop-blur-sm bg-opacity-70">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 shadow-lg">
        <Image
          src="/logo-compressed.png"
          alt="OpsKnight"
          width={64}
          height={64}
          priority
          loading="eager"
          fetchPriority="high"
          unoptimized
        />
        <div className="h-2 w-40 overflow-hidden rounded-full bg-[color:var(--bg-secondary)]">
          <span className="block h-full w-1/2 animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
