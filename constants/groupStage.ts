export interface GroupStanding {
  rank: number;
  flag: string;
  name: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface GroupResult {
  homeFlag: string;
  homeTeam: string;
  homeScore: number | null;
  awayFlag: string;
  awayTeam: string;
  awayScore: number | null;
  status: '종료' | '예정';
  date: string;
}

export const GROUP_A_STANDINGS: GroupStanding[] = [
  { rank: 1, flag: '🇲🇽', name: '멕시코', played: 1, win: 1, draw: 0, loss: 0, goalsFor: 2, goalsAgainst: 0, points: 3 },
  { rank: 2, flag: '🇰🇷', name: '대한민국', played: 1, win: 1, draw: 0, loss: 0, goalsFor: 2, goalsAgainst: 1, points: 3 },
  { rank: 3, flag: '🇿🇦', name: '남아프리카공화국', played: 2, win: 0, draw: 1, loss: 1, goalsFor: 1, goalsAgainst: 3, points: 1 },
  { rank: 4, flag: '🇨🇿', name: '체코', played: 2, win: 0, draw: 1, loss: 1, goalsFor: 2, goalsAgainst: 3, points: 1 },
];

export const GROUP_A_RESULTS: GroupResult[] = [
  { homeFlag: '🇲🇽', homeTeam: '멕시코', homeScore: 2, awayFlag: '🇿🇦', awayTeam: '남아공', awayScore: 0, status: '종료', date: '6/11' },
  { homeFlag: '🇰🇷', homeTeam: '대한민국', homeScore: 2, awayFlag: '🇨🇿', awayTeam: '체코', awayScore: 1, status: '종료', date: '6/11' },
  { homeFlag: '🇨🇿', homeTeam: '체코', homeScore: 1, awayFlag: '🇿🇦', awayTeam: '남아공', awayScore: 1, status: '종료', date: '6/18' },
  { homeFlag: '🇲🇽', homeTeam: '멕시코', homeScore: null, awayFlag: '🇰🇷', awayTeam: '대한민국', awayScore: null, status: '예정', date: '6/18 현지' },
  { homeFlag: '🇨🇿', homeTeam: '체코', homeScore: null, awayFlag: '🇲🇽', awayTeam: '멕시코', awayScore: null, status: '예정', date: '6/24' },
  { homeFlag: '🇿🇦', homeTeam: '남아공', homeScore: null, awayFlag: '🇰🇷', awayTeam: '대한민국', awayScore: null, status: '예정', date: '6/24' },
];

export const GROUP_A_RESULTS_UPDATED_AT = 'ESPN 기준 · 2026년 6월 18일 현재';
