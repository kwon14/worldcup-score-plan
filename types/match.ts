export type MatchStatusShort = 'NS' | 'TBD' | '1H' | 'HT' | '2H' | 'ET' | 'P' | 'FT' | 'AET' | 'PEN' | 'BT' | 'SUSP' | 'INT' | 'PST' | 'CANC' | 'ABD' | 'AWD' | 'WO' | 'LIVE';

export interface MatchStatus {
  long: string;
  short: MatchStatusShort;
  elapsed: number | null;
}

export type CardType = 'yellow' | 'red' | 'yellow_red';

export interface GoalEvent {
  time: number;
  extraTime: number | null;
  side: 'home' | 'away';
  teamName: string;
  scorer: string;
  assist: string | null;
  type: 'normal' | 'penalty' | 'own_goal';
}

export interface CardEvent {
  time: number;
  side: 'home' | 'away';
  teamName: string;
  player: string;
  cardType: CardType;
}

export interface LineupPlayer {
  name: string;
  number: number;
  position: string;
}

export interface TeamLineup {
  teamName: string;
  formation: string;
  starters: LineupPlayer[];
  bench: LineupPlayer[];
}

export interface LiveMatchResponse {
  available: boolean;
  fixtureId: number | null;
  status: MatchStatus | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  homeHalfScore: number | null;
  awayHalfScore: number | null;
  goals: GoalEvent[];
  cards: CardEvent[];
  lineups: TeamLineup[];
  lastUpdated: string;
  error?: string;
}
