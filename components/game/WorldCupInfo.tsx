'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMatch } from '@/contexts/MatchContext';

const GROUP_A_TEAMS = [
  { flag: '🇲🇽', name: '멕시코', extra: '개최국' },
  { flag: '🇰🇷', name: '대한민국', extra: 'FIFA 26위' },
  { flag: '🇿🇦', name: '남아프리카공화국', extra: 'FIFA 68위' },
  { flag: '🇨🇿', name: '체코', extra: 'FIFA 40위' },
];

const KOREA_INFO = {
  flag: '🇰🇷',
  name: '대한민국',
  rank: 'FIFA 26위',
  coach: '홍명보',
  keyPlayers: ['손흥민 (LA FC)', '김민재 (바이에른)', '이강인 (PSG)'],
  borderClass: 'border-t-korea-red',
  accentClass: 'text-korea-red',
  bgClass: 'bg-red-50',
};

function TeamCard({
  flag, name, rank, coach, keyPlayers, borderClass, accentClass, bgClass,
}: {
  flag: string; name: string; rank: string; coach: string;
  keyPlayers: string[]; borderClass: string; accentClass: string; bgClass: string;
}) {
  return (
    <div className={`rounded-xl border bg-white border-t-4 ${borderClass} p-4 flex-1`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{flag}</span>
        <div>
          <p className="font-bold text-sm">{name}</p>
          <p className={`text-xs font-medium ${accentClass}`}>{rank}</p>
        </div>
      </div>
      <div className={`rounded-lg ${bgClass} px-3 py-2 space-y-1`}>
        <p className="text-xs text-muted-foreground">
          감독 <span className="font-semibold text-foreground">{coach}</span>
        </p>
        {keyPlayers.map((p) => (
          <p key={p} className="text-xs text-muted-foreground">⚽ {p}</p>
        ))}
      </div>
    </div>
  );
}

export function WorldCupInfo() {
  const { match } = useMatch();
  const hh = match.headToHead;
  const away = match.awayTeamInfo;

  return (
    <div className="space-y-3">
      {/* A조 구성 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            🏆 2026 FIFA 월드컵 A조
            <span className="text-xs font-normal text-muted-foreground">북중미 개최</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {GROUP_A_TEAMS.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted/30"
            >
              <span className="text-lg">{t.flag}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.extra}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 팀 소개 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">팀 소개</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <TeamCard {...KOREA_INFO} />
          <TeamCard
            flag={match.awayTeamFlag}
            name={match.awayTeamName}
            rank={away.rank}
            coach={away.coach}
            keyPlayers={away.keyPlayers}
            borderClass={away.borderClass}
            accentClass={away.accentClass}
            bgClass={away.bgClass}
          />
        </CardContent>
      </Card>

      {/* 역대 상대 전적 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">역대 상대 전적</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 전체 */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">전체 ({hh.total}전)</p>
            <div className="flex rounded-lg overflow-hidden text-xs font-semibold text-center">
              <div className="bg-korea-red text-white py-1.5" style={{ flex: hh.koreaWin }}>
                한국 {hh.koreaWin}승
              </div>
              <div className="bg-slate-300 text-slate-700 py-1.5" style={{ flex: hh.draw }}>
                {hh.draw}무
              </div>
              <div
                className={`text-white py-1.5 ${away.bgClass.replace('bg-', 'bg-').replace('-50', '-600') === away.bgClass ? 'bg-slate-500' : ''}`}
                style={{
                  flex: hh.awayWin,
                  backgroundColor: away.borderClass.includes('green') ? '#16a34a' : away.borderClass.includes('blue') ? '#2563eb' : '#6b7280',
                }}
              >
                {match.awayTeamName} {hh.awayWin}승
              </div>
            </div>
          </div>

          {/* 월드컵 한정 (데이터 있을 때만) */}
          {hh.wcTotal !== undefined && hh.wcTotal > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">월드컵 한정 ({hh.wcTotal}전)</p>
              <div className="flex rounded-lg overflow-hidden text-xs font-semibold text-center">
                <div className={`py-1.5 flex-1 ${(hh.wcKoreaWin ?? 0) > 0 ? 'bg-korea-red text-white' : 'bg-slate-200 text-slate-500'}`}>
                  한국 {hh.wcKoreaWin ?? 0}승
                </div>
                <div className="bg-slate-200 text-slate-500 py-1.5 flex-1">
                  {hh.wcDraw ?? 0}무
                </div>
                <div
                  className="text-white py-1.5 flex-[2]"
                  style={{
                    backgroundColor: away.borderClass.includes('green') ? '#16a34a' : away.borderClass.includes('blue') ? '#2563eb' : '#6b7280',
                  }}
                >
                  {match.awayTeamName} {hh.wcAwayWin ?? 0}승
                </div>
              </div>
              {hh.wcNote && (
                <p className="text-xs text-muted-foreground mt-1">{hh.wcNote} · 최근 대결: {hh.lastMeeting}</p>
              )}
            </div>
          )}

          {(!hh.wcTotal || hh.wcTotal === 0) && (
            <p className="text-xs text-muted-foreground">최근 대결: {hh.lastMeeting}</p>
          )}
        </CardContent>
      </Card>

      {/* 경기 일정 */}
      <Card className="border-korea-blue/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📍</div>
            <div className="space-y-0.5">
              <p className="font-semibold text-sm">{match.venue || '장소 미정'}</p>
              <p className="text-xs text-muted-foreground">{match.localDate}</p>
              <p className="text-xs font-medium text-korea-red">{match.date}</p>
              <p className="text-xs text-muted-foreground mt-1">
                📺 SBS · MBC · KBS 생중계 예정
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
