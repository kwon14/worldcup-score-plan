export interface PlayerData {
  name: string;
  position: string;
  club: string;        // 2026 소속팀
  nationalGoals: number; // A대표팀 통산 골
  scoringProb: number;   // 이번 경기 득점 확률 (%)
}

export const KOREA_PLAYER_DATA: PlayerData[] = [
  { name: '손흥민',   position: 'FW', club: '토트넘',        nationalGoals: 35, scoringProb: 30 },
  { name: '황희찬',   position: 'FW', club: '울버햄튼',      nationalGoals: 18, scoringProb: 18 },
  { name: '조규성',   position: 'FW', club: '미정',          nationalGoals: 18, scoringProb: 15 },
  { name: '이강인',   position: 'MF', club: 'PSG',           nationalGoals: 10, scoringProb: 12 },
  { name: '정우영',   position: 'FW', club: '미정',          nationalGoals: 12, scoringProb: 8  },
  { name: '이재성',   position: 'MF', club: '미정',          nationalGoals: 10, scoringProb: 5  },
  { name: '황인범',   position: 'MF', club: '미정',          nationalGoals: 7,  scoringProb: 4  },
  { name: '김민재',   position: 'DF', club: '바이에른뮌헨',  nationalGoals: 3,  scoringProb: 1  },
  { name: '설영우',   position: 'DF', club: '미정',          nationalGoals: 1,  scoringProb: 1  },
  { name: '김진수',   position: 'DF', club: '미정',          nationalGoals: 3,  scoringProb: 1  },
  { name: '조현우',   position: 'GK', club: '미정',          nationalGoals: 0,  scoringProb: 0  },
  { name: '없음',     position: '-',  club: '-',             nationalGoals: 0,  scoringProb: 5  },
];

export const MEXICO_PLAYER_DATA: PlayerData[] = [
  { name: 'S. 히메네스', position: 'FW', club: '바이어 레버쿠젠', nationalGoals: 12, scoringProb: 25 },
  { name: 'R. 히메네스', position: 'FW', club: '풀럼',            nationalGoals: 28, scoringProb: 18 },
  { name: '로사노',      position: 'FW', club: '미정',             nationalGoals: 19, scoringProb: 15 },
  { name: 'H. 마르틴',  position: 'FW', club: '클루바 아메리카',  nationalGoals: 18, scoringProb: 10 },
  { name: '알렉시스 베가', position: 'MF', club: '미정',           nationalGoals: 10, scoringProb: 10 },
  { name: '피네다',      position: 'MF', club: '미정',             nationalGoals: 8,  scoringProb: 7  },
  { name: '알바라도',    position: 'MF', club: '과달라하라',        nationalGoals: 7,  scoringProb: 5  },
  { name: '에드손 알바레스', position: 'MF', club: '웨스트햄',     nationalGoals: 5,  scoringProb: 3  },
  { name: '없음',        position: '-',  club: '-',                nationalGoals: 0,  scoringProb: 7  },
];

export const CZECH_PLAYER_DATA: PlayerData[] = [
  { name: 'P. 시크',      position: 'FW', club: '레버쿠젠',  nationalGoals: 29, scoringProb: 30 },
  { name: 'A. 흘로젝',    position: 'FW', club: '레버쿠젠',  nationalGoals: 12, scoringProb: 18 },
  { name: 'J. 페섹',      position: 'FW', club: '미정',      nationalGoals: 8,  scoringProb: 12 },
  { name: 'A. 바라크',    position: 'MF', club: '미정',      nationalGoals: 8,  scoringProb: 8  },
  { name: 'T. 수체크',    position: 'MF', club: '웨스트햄',  nationalGoals: 12, scoringProb: 6  },
  { name: 'J. 얀크토',    position: 'MF', club: '미정',      nationalGoals: 8,  scoringProb: 4  },
  { name: 'V. 코우팔',    position: 'DF', club: '웨스트햄',  nationalGoals: 1,  scoringProb: 1  },
  { name: 'L. 크레이치',  position: 'DF', club: '미정',      nationalGoals: 1,  scoringProb: 1  },
  { name: 'O. 콜라르',    position: 'GK', club: '미정',      nationalGoals: 0,  scoringProb: 0  },
  { name: '없음',         position: '-',  club: '-',         nationalGoals: 0,  scoringProb: 5  },
];

// 하위 호환용 — predict 폼 외 곳에서 단순 이름 배열이 필요할 때 사용
export const KOREA_PLAYERS = KOREA_PLAYER_DATA.map((p) => p.name) as string[];
export const MEXICO_PLAYERS = MEXICO_PLAYER_DATA.map((p) => p.name) as string[];
export const CZECH_PLAYERS = CZECH_PLAYER_DATA.map((p) => p.name) as string[];
