import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a0b3b] to-[#0d1b3e] flex flex-col items-center justify-center px-4 gap-8">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight text-center">
        🎮 게임 모음
      </h1>
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
        <Link
          href="/roulette"
          className="flex-1 flex flex-col items-center gap-3 bg-white/10 hover:bg-white/15
            border border-white/15 rounded-3xl p-8 text-white transition-all
            hover:scale-105 active:scale-95 shadow-xl"
        >
          <span className="text-6xl">🎡</span>
          <span className="text-xl font-bold">룰렛</span>
          <span className="text-white/50 text-sm text-center">항목을 추가하고 룰렛을 돌려보세요</span>
        </Link>
        <Link
          href="/ladder"
          className="flex-1 flex flex-col items-center gap-3 bg-white/10 hover:bg-white/15
            border border-white/15 rounded-3xl p-8 text-white transition-all
            hover:scale-105 active:scale-95 shadow-xl"
        >
          <span className="text-6xl">🪜</span>
          <span className="text-xl font-bold">사다리타기</span>
          <span className="text-white/50 text-sm text-center">사다리를 타며 결과를 확인하세요</span>
        </Link>
      </div>
    </div>
  );
}
