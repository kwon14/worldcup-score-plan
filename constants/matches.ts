import { MEXICO_PLAYER_DATA, CZECH_PLAYER_DATA, SOUTH_AFRICA_PLAYER_DATA, KOREA_SOUTH_AFRICA_LINEUP_PLAYER_DATA, type PlayerData } from './players';

export interface AwayTeamInfo {
  rank: string;
  coach: string;
  keyPlayers: string[];
  borderClass: string;
  accentClass: string;
  bgClass: string;
}

export interface HeadToHead {
  total: number;
  koreaWin: number;
  draw: number;
  awayWin: number;
  wcTotal?: number;
  wcKoreaWin?: number;
  wcDraw?: number;
  wcAwayWin?: number;
  lastMeeting: string;
  wcNote?: string;
}

export interface MatchConfig {
  id: string;
  label: string;
  awayTeamName: string;
  awayTeamFlag: string;
  date: string;
  localDate: string;
  venue: string;
  koreaPlayerData?: PlayerData[];
  awayPlayerData: PlayerData[];
  awayTeamInfo: AwayTeamInfo;
  headToHead: HeadToHead;
  matchResultLabels: Record<string, string>;
  halfTimeResultLabels: Record<string, string>;
  firstGoalTeamLabels: Record<string, string>;
}

export const MATCHES: Record<string, MatchConfig> = {
  '1': {
    id: '1',
    label: '1차전',
    awayTeamName: '체코',
    awayTeamFlag: '🇨🇿',
    date: '2026년 6월 12일 11:00 (KST)',
    localDate: '현지: 6월 11일 21:00 (CDT)',
    venue: '에스타디오 아크론, 과달라하라',
    awayPlayerData: CZECH_PLAYER_DATA,
    awayTeamInfo: {
      rank: 'FIFA 40위',
      coach: '미정',
      keyPlayers: ['P. 시크 (레버쿠젠)', 'A. 흘로젝', 'T. 수체크 (웨스트햄)'],
      borderClass: 'border-t-blue-600',
      accentClass: 'text-blue-700',
      bgClass: 'bg-blue-50',
    },
    headToHead: {
      total: 7,
      koreaWin: 3,
      draw: 2,
      awayWin: 2,
      lastMeeting: '2023년 · 1-2 패',
    },
    matchResultLabels: {
      KOREA_WIN: '🇰🇷 대한민국 승',
      DRAW: '🤝 무승부',
      MEXICO_WIN: '🇨🇿 체코 승',
    },
    halfTimeResultLabels: {
      KOREA_LEAD: '🇰🇷 대한민국 리드',
      DRAW: '🤝 무승부',
      MEXICO_LEAD: '🇨🇿 체코 리드',
    },
    firstGoalTeamLabels: {
      KOREA: '🇰🇷 대한민국',
      MEXICO: '🇨🇿 체코',
      NONE: '없음 (무득점)',
    },
  },
  '2': {
    id: '2',
    label: '2차전',
    awayTeamName: '멕시코',
    awayTeamFlag: '🇲🇽',
    date: '2026년 6월 19일 11:00 (KST)',
    localDate: '현지: 6월 18일 21:00 (CDT)',
    venue: '에스타디오 아크론, 과달라하라',
    awayPlayerData: MEXICO_PLAYER_DATA,
    awayTeamInfo: {
      rank: '개최국 · FIFA 15위',
      coach: 'J.M. 세라노',
      keyPlayers: ['H. 로사노', 'S. 히메네스', 'A. 비달'],
      borderClass: 'border-t-green-600',
      accentClass: 'text-green-700',
      bgClass: 'bg-green-50',
    },
    headToHead: {
      total: 15,
      koreaWin: 3,
      draw: 3,
      awayWin: 9,
      wcTotal: 2,
      wcKoreaWin: 0,
      wcDraw: 0,
      wcAwayWin: 2,
      lastMeeting: '2025년 · 2-2 무승부',
      wcNote: '1998 프랑스 3-1, 2018 러시아 2-1',
    },
    matchResultLabels: {
      KOREA_WIN: '🇰🇷 대한민국 승',
      DRAW: '🤝 무승부',
      MEXICO_WIN: '🇲🇽 멕시코 승',
    },
    halfTimeResultLabels: {
      KOREA_LEAD: '🇰🇷 대한민국 리드',
      DRAW: '🤝 무승부',
      MEXICO_LEAD: '🇲🇽 멕시코 리드',
    },
    firstGoalTeamLabels: {
      KOREA: '🇰🇷 대한민국',
      MEXICO: '🇲🇽 멕시코',
      NONE: '없음 (무득점)',
    },
  },
  '3': {
    id: '3',
    label: '3차전',
    awayTeamName: '남아공',
    awayTeamFlag: '🇿🇦',
    date: '2026년 6월 25일 10:00 (KST)',
    localDate: '현지: 6월 24일 19:00 (CST)',
    venue: '에스타디오 BBVA, 과달루페',
    koreaPlayerData: KOREA_SOUTH_AFRICA_LINEUP_PLAYER_DATA,
    awayPlayerData: SOUTH_AFRICA_PLAYER_DATA,
    awayTeamInfo: {
      rank: 'FIFA 60위',
      coach: 'H. 브루스',
      keyPlayers: ['P. 타우', 'L. 포스터 (번리)', 'T. 즈와네'],
      borderClass: 'border-t-yellow-500',
      accentClass: 'text-yellow-700',
      bgClass: 'bg-yellow-50',
    },
    headToHead: {
      total: 1,
      koreaWin: 0,
      draw: 0,
      awayWin: 1,
      lastMeeting: '2000년 · 0-1 패',
    },
    matchResultLabels: {
      KOREA_WIN: '🇰🇷 대한민국 승',
      DRAW: '🤝 무승부',
      MEXICO_WIN: '🇿🇦 남아공 승',
    },
    halfTimeResultLabels: {
      KOREA_LEAD: '🇰🇷 대한민국 리드',
      DRAW: '🤝 무승부',
      MEXICO_LEAD: '🇿🇦 남아공 리드',
    },
    firstGoalTeamLabels: {
      KOREA: '🇰🇷 대한민국',
      MEXICO: '🇿🇦 남아공',
      NONE: '없음 (무득점)',
    },
  },
};

export const DEFAULT_MATCH_ID = '3';
