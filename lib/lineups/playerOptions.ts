import type { TeamLineup } from '@/types/match';
import type { PlayerData } from '@/constants/players';

const DIRECT_INPUT = '직접 입력';

const ESPN_NAME_KO: Record<string, string> = {
  'Ronwen Williams': '론웬 윌리엄스',
  'Ime Okon': '이미 오콘',
  'Aubrey Modiba': '오브리 모디바',
  'Khuliso Mudau': '훌리소 무다우',
  'Mbekezeli Mbokazi': '음베케젤리 음보카지',
  'Thalente Mbatha': '탈렌테 음바타',
  'Thapelo Maseko': '타펠로 마세코',
  'Sphephelo Sithole': '스페펠로 시톨레',
  'Relebohile Mofokeng': '렐레보힐레 모포켕',
  'Oswin Appollis': '오스윈 아폴리스',
  'Evidence Makgopa': '에비던스 마크고파',
  'Lyle Foster': '라일 포스터',
  'Olwethu Makhanya': '올웨투 마칸야',
  'Khulumani Ndamane': '쿨루마니 은다마네',
  'Bradley Cross': '브래들리 크로스',
  'Ricardo Goss': '리카르도 고스',
  'Thabang Matuludi': '타방 마툴루디',
  'Nkosinathi Sibisi': '은코시나티 시비시',
  'Samukele Kabini': '사무켈레 카비니',
  'Sipho Chaine': '시포 차이네',
  'Tshepang Moremi': '체팡 모레미',
  'Kamogelo Sebelebele': '카모겔로 세벨레벨레',
  'Jayden Adams': '제이든 애덤스',
  'Iqraam Rayners': '이크라암 레이너스',
  'Themba Zwane': '템바 즈와네',
  'Kim Seung-Gyu': '김승규',
  'Kim Min-Jae': '김민재',
  'Lee Gi-Hyuk': '이기혁',
  'Lee Han-Beom': '이한범',
  'Hwang In-Beom': '황인범',
  'Lee Kang-In': '이강인',
  'Lee Tae-Seok': '이태석',
  'Seol Young-Woo': '설영우',
  'Hwang Hee-Chan': '황희찬',
  'Paik Seung-Ho': '백승호',
  'Oh Hyeon-Gyu': '오현규',
  'Lee Dong-Gyeong': '이동경',
  'Kim Jin-Gyu': '김진규',
  'Jens Castrop': '옌스 카스트로프',
  'Cho Gue-Sung': '조규성',
  'Jo Hyeon-Woo': '조현우',
  'Kim Tae-Hyeon': '김태현',
  'Song Bum-Keun': '송범근',
  'Park Jin-Seop': '박진섭',
  'Eom Ji-Sung': '엄지성',
  'Kim Moon-Hwan': '김문환',
  'Bae Jun-Ho': '배준호',
  'Son Heung-Min': '손흥민',
  'Cho Wi-Je': '조위제',
  'Lee Jae-Sung': '이재성',
  'Yang Hyun-Jun': '양현준',
};

export function translateLineupName(name: string) {
  return ESPN_NAME_KO[name] ?? name;
}

function isKoreaTeam(teamName: string) {
  const lower = teamName.toLowerCase();
  return lower.includes('korea') || teamName.includes('대한민국');
}

function uniquePlayerNames(names: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawName of names) {
    const name = rawName.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    result.push(name);
  }

  return result;
}

function namesFromLineup(lineup: TeamLineup) {
  return uniquePlayerNames([
    ...lineup.starters.map((player) => player.name),
    ...lineup.bench.map((player) => player.name),
  ].map(translateLineupName));
}

function withDirectInput(names: string[]) {
  const withoutDirectInput = names.filter((name) => name !== DIRECT_INPUT);
  return [...withoutDirectInput, DIRECT_INPUT];
}

export function buildLineupPlayerOptions({
  lineups,
  fallbackKoreaPlayers,
  fallbackAwayPlayers,
}: {
  lineups: TeamLineup[];
  fallbackKoreaPlayers: string[];
  fallbackAwayPlayers: string[];
}) {
  const koreaLineup = lineups.find((lineup) => isKoreaTeam(lineup.teamName));
  const awayLineup = lineups.find((lineup) => !isKoreaTeam(lineup.teamName));

  return {
    koreaPlayers: withDirectInput(koreaLineup ? namesFromLineup(koreaLineup) : fallbackKoreaPlayers),
    awayPlayers: withDirectInput(awayLineup ? namesFromLineup(awayLineup) : fallbackAwayPlayers),
  };
}

export function buildPredictionPlayerData(lineupPlayers: string[] | undefined, fallbackPlayers: PlayerData[]) {
  if (!lineupPlayers || lineupPlayers.length === 0) return fallbackPlayers;

  const fallbackByName = new Map(fallbackPlayers.map((player) => [player.name, player]));
  const nonePlayer = fallbackByName.get('없음') ?? {
    name: '없음',
    position: '-',
    club: '-',
    nationalGoals: 0,
    scoringProb: 0,
  };

  const players = uniquePlayerNames(lineupPlayers.map(translateLineupName))
    .filter((name) => name !== '없음' && name !== DIRECT_INPUT)
    .map((name): PlayerData => fallbackByName.get(name) ?? {
      name,
      position: '-',
      club: '라인업',
      nationalGoals: 0,
      scoringProb: 0,
    });

  return [...players, nonePlayer];
}
