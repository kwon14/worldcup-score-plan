import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  style: 'border-t-4 border-t-korea-red',
  accent: 'text-korea-red',
  bg: 'bg-red-50',
};

const MEXICO_INFO = {
  flag: '🇲🇽',
  name: '멕시코',
  rank: '개최국 · FIFA 15위',
  coach: 'J.M. 세라노',
  keyPlayers: ['H.로사노', 'S.히메네스', 'A.비달'],
  style: 'border-t-4 border-t-green-600',
  accent: 'text-green-700',
  bg: 'bg-green-50',
};

// 역대 전적: 15전 멕시코 9승 3무 한국 3승 (월드컵: 멕시코 2승)
const HH = {
  total: 15,
  koreaWin: 3,
  draw: 3,
  mexicoWin: 9,
  wcKoreaWin: 0,
  wcDraw: 0,
  wcMexicoWin: 2,
  lastMeeting: '2025년 · 2-2 무승부',
};

function TeamCard({ team }: { team: typeof KOREA_INFO }) {
  return (
    <div className={`rounded-xl border bg-white ${team.style} p-4 flex-1`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{team.flag}</span>
        <div>
          <p className="font-bold text-sm">{team.name}</p>
          <p className={`text-xs font-medium ${team.accent}`}>{team.rank}</p>
        </div>
      </div>
      <div className={`rounded-lg ${team.bg} px-3 py-2 space-y-1`}>
        <p className="text-xs text-muted-foreground">
          감독 <span className="font-semibold text-foreground">{team.coach}</span>
        </p>
        {team.keyPlayers.map((p) => (
          <p key={p} className="text-xs text-muted-foreground">⚽ {p}</p>
        ))}
      </div>
    </div>
  );
}

export function WorldCupInfo() {
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
          <TeamCard team={KOREA_INFO} />
          <TeamCard team={MEXICO_INFO} />
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
            <p className="text-xs text-muted-foreground mb-1.5">전체 ({HH.total}전)</p>
            <div className="flex rounded-lg overflow-hidden text-xs font-semibold text-center">
              <div
                className="bg-korea-red text-white py-1.5"
                style={{ flex: HH.koreaWin }}
              >
                한국 {HH.koreaWin}승
              </div>
              <div
                className="bg-slate-300 text-slate-700 py-1.5"
                style={{ flex: HH.draw }}
              >
                {HH.draw}무
              </div>
              <div
                className="bg-green-600 text-white py-1.5"
                style={{ flex: HH.mexicoWin }}
              >
                멕시코 {HH.mexicoWin}승
              </div>
            </div>
          </div>

          {/* 월드컵 한정 */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">월드컵 한정 (2전)</p>
            <div className="flex rounded-lg overflow-hidden text-xs font-semibold text-center">
              <div className="bg-slate-200 text-slate-500 py-1.5 flex-1">
                한국 {HH.wcKoreaWin}승
              </div>
              <div className="bg-slate-200 text-slate-500 py-1.5 flex-1">
                {HH.wcDraw}무
              </div>
              <div className="bg-green-600 text-white py-1.5 flex-[2]">
                멕시코 {HH.wcMexicoWin}승
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              1998 프랑스 3-1, 2018 러시아 2-1 · 최근 대결: {HH.lastMeeting}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 경기 일정 */}
      <Card className="border-korea-blue/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📍</div>
            <div className="space-y-0.5">
              <p className="font-semibold text-sm">에스타디오 아크론, 과달라하라</p>
              <p className="text-xs text-muted-foreground">현지: 6월 18일 21:00 (CDT)</p>
              <p className="text-xs font-medium text-korea-red">한국: 6월 19일 11:00 (KST)</p>
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
