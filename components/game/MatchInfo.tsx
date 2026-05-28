interface MatchInfoProps {
  date?: string;
  venue?: string;
}

export function MatchInfo({ date = '2026년 6월 19일', venue = '로스앤젤레스' }: MatchInfoProps) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-korea-blue to-korea-red p-6 text-white">
      <p className="text-center text-xs font-medium uppercase tracking-widest opacity-80">
        2026 FIFA 월드컵
      </p>

      <div className="mt-4 flex items-center justify-center gap-6">
        {/* 대한민국 */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">🇰🇷</span>
          <span className="text-sm font-semibold">대한민국</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold opacity-60">VS</span>
        </div>

        {/* 멕시코 */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">🇲🇽</span>
          <span className="text-sm font-semibold">멕시코</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-xs opacity-70">
        <span>📅 {date}</span>
        <span>·</span>
        <span>📍 {venue}</span>
      </div>
    </div>
  );
}
