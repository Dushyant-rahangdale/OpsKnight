import Image from 'next/image';

export default function MobileLoading() {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-slate-950/80">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-900 dark:bg-slate-950">
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
        <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <span className="block h-full w-1/2 animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
