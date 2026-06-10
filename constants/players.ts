export interface PlayerData {
  name: string;
  position: string;
  club: string;        // 2026 소속팀
  nationalGoals: number; // A대표팀 통산 골
  scoringProb: number;   // 이번 경기 득점 확률 (%)
}

export const KOREA_PLAYER_DATA: PlayerData[] = [
  { name: '손흥민',   position: 'FW', club: 'LA FC',          nationalGoals: 35, scoringProb: 28 },
  { name: '황희찬',   position: 'FW', club: '울버햄튼',        nationalGoals: 20, scoringProb: 16 },
  { name: '조규성',   position: 'FW', club: '미트윌란',        nationalGoals: 20, scoringProb: 13 },
  { name: '오현규',   position: 'FW', club: '베식타스',        nationalGoals: 10, scoringProb: 12 },
  { name: '이강인',   position: 'MF', club: 'PSG',             nationalGoals: 12, scoringProb: 10 },
  { name: '양현준',   position: 'FW', club: '셀틱',            nationalGoals: 6,  scoringProb: 8  },
  { name: '배준호',   position: 'MF', club: '스토크시티',      nationalGoals: 4,  scoringProb: 4  },
  { name: '이재성',   position: 'MF', club: '마인츠',          nationalGoals: 10, scoringProb: 4  },
  { name: '황인범',   position: 'MF', club: '페예노르트',      nationalGoals: 7,  scoringProb: 3  },
  { name: '김민재',   position: 'DF', club: '바이에른뮌헨',    nationalGoals: 3,  scoringProb: 1  },
  { name: '설영우',   position: 'DF', club: '레드스타',        nationalGoals: 1,  scoringProb: 1  },
  { name: '조현우',   position: 'GK', club: '미정',            nationalGoals: 0,  scoringProb: 0  },
  { name: '없음',     position: '-',  club: '-',               nationalGoals: 0,  scoringProb: 5  },
];

export const MEXICO_PLAYER_DATA: PlayerData[] = [
  { name: 'S. 히메네스',    position: 'FW', club: 'AC 밀란',       nationalGoals: 15, scoringProb: 25 },
  { name: 'R. 히메네스',    position: 'FW', club: '풀럼',           nationalGoals: 28, scoringProb: 18 },
  { name: '세사르 우에르타', position: 'FW', club: '안데를레흐트',  nationalGoals: 5,  scoringProb: 12 },
  { name: '알렉시스 베가',   position: 'MF', club: '톨루카',        nationalGoals: 10, scoringProb: 10 },
  { name: '훌리안 키노네스', position: 'FW', club: 'Al-콰드시야',   nationalGoals: 8,  scoringProb: 8  },
  { name: '에드손 알바레스', position: 'MF', club: '페네르바흐체',  nationalGoals: 5,  scoringProb: 5  },
  { name: '피네다',          position: 'MF', club: 'AEK 아테네',    nationalGoals: 8,  scoringProb: 7  },
  { name: '알바라도',        position: 'MF', club: '과달라하라',    nationalGoals: 7,  scoringProb: 5  },
  { name: '없음',            position: '-',  club: '-',             nationalGoals: 0,  scoringProb: 10 },
];

export const CZECH_PLAYER_DATA: PlayerData[] = [
  { name: 'P. 시크',    position: 'FW', club: '레버쿠젠',    nationalGoals: 29, scoringProb: 30 },
  { name: 'A. 흘로젝',  position: 'FW', club: '호펜하임',    nationalGoals: 12, scoringProb: 18 },
  { name: 'P. 슐츠',    position: 'MF', club: '리옹',        nationalGoals: 5,  scoringProb: 12 },
  { name: 'T. 수체크',  position: 'MF', club: '웨스트햄',    nationalGoals: 12, scoringProb: 8  },
  { name: 'A. 바라크',  position: 'MF', club: '미정',        nationalGoals: 8,  scoringProb: 6  },
  { name: 'J. 얀크토',  position: 'MF', club: '미정',        nationalGoals: 8,  scoringProb: 4  },
  { name: 'V. 코우팔',  position: 'DF', club: '호펜하임',    nationalGoals: 1,  scoringProb: 1  },
  { name: 'L. 크레이치', position: 'DF', club: '울버햄튼',   nationalGoals: 1,  scoringProb: 1  },
  { name: 'O. 콜라르',  position: 'GK', club: '미정',        nationalGoals: 0,  scoringProb: 0  },
  { name: '없음',       position: '-',  club: '-',           nationalGoals: 0,  scoringProb: 5  },
];

// 하위 호환용 — predict 폼 외 곳에서 단순 이름 배열이 필요할 때 사용
export const KOREA_PLAYERS = KOREA_PLAYER_DATA.map((p) => p.name) as string[];
export const MEXICO_PLAYERS = MEXICO_PLAYER_DATA.map((p) => p.name) as string[];
export const CZECH_PLAYERS = CZECH_PLAYER_DATA.map((p) => p.name) as string[];
