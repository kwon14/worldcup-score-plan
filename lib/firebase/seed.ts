import {
  collection, doc, setDoc, deleteDoc, getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

const SAMPLE_PREDICTIONS = [
  {
    participantId: 'sample_권민준_001',
    name: '권민준', team: '대한민국',
    matchResult: 'KOREA_WIN', koreaScore: 2, mexicoScore: 1,
    koreaFirstScorer: '손흥민', mexicoFirstScorer: 'R. 히메네스',
    firstGoalTeam: 'KOREA', firstGoalTimeRange: '0_15',
    halfTimeResult: 'KOREA_LEAD', cardRange: '3_5',
    mvp: '손흥민', comment: '손흥민 멀티골로 승리!',
    halftimeRevised: false,
  },
  {
    participantId: 'sample_이수진_002',
    name: '이수진', team: '대한민국',
    matchResult: 'KOREA_WIN', koreaScore: 1, mexicoScore: 0,
    koreaFirstScorer: '황희찬', mexicoFirstScorer: '없음',
    firstGoalTeam: 'KOREA', firstGoalTimeRange: '16_30',
    halfTimeResult: 'KOREA_LEAD', cardRange: '0_2',
    mvp: '황희찬', comment: '황희찬의 결승골',
    halftimeRevised: false,
  },
  {
    participantId: 'sample_박지훈_003',
    name: '박지훈', team: '대한민국',
    matchResult: 'DRAW', koreaScore: 1, mexicoScore: 1,
    koreaFirstScorer: '이강인', mexicoFirstScorer: 'S. 히메네스',
    firstGoalTeam: 'MEXICO', firstGoalTimeRange: '0_15',
    halfTimeResult: 'DRAW', cardRange: '3_5',
    mvp: '이강인', comment: '비길 것 같은 느낌',
    halftimeRevised: false,
  },
  {
    participantId: 'sample_김서연_004',
    name: '김서연', team: '대한민국',
    matchResult: 'KOREA_WIN', koreaScore: 3, mexicoScore: 1,
    koreaFirstScorer: '손흥민', mexicoFirstScorer: '로사노',
    firstGoalTeam: 'KOREA', firstGoalTimeRange: '0_15',
    halfTimeResult: 'KOREA_LEAD', cardRange: '3_5',
    mvp: '손흥민', comment: '대량득점 예상!',
    halftimeRevised: false,
  },
  {
    participantId: 'sample_최도현_005',
    name: '최도현', team: '대한민국',
    matchResult: 'MEXICO_WIN', koreaScore: 0, mexicoScore: 2,
    koreaFirstScorer: '없음', mexicoFirstScorer: 'R. 히메네스',
    firstGoalTeam: 'MEXICO', firstGoalTimeRange: '16_30',
    halfTimeResult: 'MEXICO_LEAD', cardRange: '0_2',
    mvp: 'R. 히메네스', comment: '현실적으로 힘들다고 봄',
    halftimeRevised: false,
  },
  {
    participantId: 'sample_정하은_006',
    name: '정하은', team: '대한민국',
    matchResult: 'KOREA_WIN', koreaScore: 2, mexicoScore: 0,
    koreaFirstScorer: '조규성', mexicoFirstScorer: '없음',
    firstGoalTeam: 'KOREA', firstGoalTimeRange: '31_45',
    halfTimeResult: 'KOREA_LEAD', cardRange: '6_PLUS',
    mvp: '조규성', comment: '조규성 시대 열린다',
    halftimeRevised: false,
  },
  {
    participantId: 'sample_윤재원_007',
    name: '윤재원', team: '대한민국',
    matchResult: 'DRAW', koreaScore: 2, mexicoScore: 2,
    koreaFirstScorer: '황희찬', mexicoFirstScorer: 'S. 히메네스',
    firstGoalTeam: 'MEXICO', firstGoalTimeRange: '0_15',
    halfTimeResult: 'MEXICO_LEAD', cardRange: '3_5',
    mvp: '황희찬', comment: '끝까지 접전',
    halftimeRevised: false,
  },
  {
    participantId: 'sample_오민지_008',
    name: '오민지', team: '대한민국',
    matchResult: 'KOREA_WIN', koreaScore: 1, mexicoScore: 0,
    koreaFirstScorer: '손흥민', mexicoFirstScorer: '없음',
    firstGoalTeam: 'KOREA', firstGoalTimeRange: '46_60',
    halfTimeResult: 'DRAW', cardRange: '0_2',
    mvp: '손흥민', comment: '후반 결승골',
    halftimeRevised: false,
  },
  {
    participantId: 'sample_한승우_009',
    name: '한승우', team: '대한민국',
    matchResult: 'KOREA_WIN', koreaScore: 2, mexicoScore: 1,
    koreaFirstScorer: '이강인', mexicoFirstScorer: 'H. 마르틴',
    firstGoalTeam: 'KOREA', firstGoalTimeRange: '16_30',
    halfTimeResult: 'DRAW', cardRange: '3_5',
    mvp: '이강인', comment: '이강인 프리킥 결승골',
    halftimeRevised: false,
  },
  {
    participantId: 'sample_임채영_010',
    name: '임채영', team: '대한민국',
    matchResult: 'KOREA_WIN', koreaScore: 3, mexicoScore: 2,
    koreaFirstScorer: '손흥민', mexicoFirstScorer: 'R. 히메네스',
    firstGoalTeam: 'KOREA', firstGoalTimeRange: '0_15',
    halfTimeResult: 'KOREA_LEAD', cardRange: '6_PLUS',
    mvp: '손흥민', comment: '대박 경기 예상',
    halftimeRevised: false,
  },
];

export async function seedSampleData(matchId: string): Promise<void> {
  const predsRef = collection(db, `m${matchId}_predictions`);
  await Promise.all(
    SAMPLE_PREDICTIONS.map((p) =>
      setDoc(doc(predsRef, p.participantId), {
        ...p,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    ),
  );

  await setDoc(doc(db, `m${matchId}_gameStatus`, 'current'), {
    status: 'BEFORE_MATCH',
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, `m${matchId}_matchState`, 'current'), {
    status: 'NS',
    koreaScore: 0,
    mexicoScore: 0,
    koreaHalfScore: null,
    mexicoHalfScore: null,
    updatedAt: serverTimestamp(),
  });
}

export async function resetAllData(matchId: string): Promise<void> {
  const predSnap = await getDocs(collection(db, `m${matchId}_predictions`));
  await Promise.all(predSnap.docs.map((d) => deleteDoc(d.ref)));

  const eventSnap = await getDocs(collection(db, `m${matchId}_matchEvents`));
  await Promise.all(eventSnap.docs.map((d) => deleteDoc(d.ref)));

  await deleteDoc(doc(db, `m${matchId}_actualResult`, 'current'));

  await setDoc(doc(db, `m${matchId}_matchState`, 'current'), {
    status: 'NS',
    koreaScore: 0,
    mexicoScore: 0,
    koreaHalfScore: null,
    mexicoHalfScore: null,
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, `m${matchId}_gameStatus`, 'current'), {
    status: 'BEFORE_MATCH',
    updatedAt: serverTimestamp(),
  });
}
