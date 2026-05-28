import {
  collection, doc, setDoc, getDoc, getDocs,
  query, orderBy, serverTimestamp, onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';

export interface PredictionDoc {
  participantId: string;
  name: string;
  team: string;
  matchResult: string;
  koreaScore: number;
  mexicoScore: number;
  koreaFirstScorer: string;
  mexicoFirstScorer: string;
  firstGoalTeam: string;
  firstGoalTimeRange: string;
  halfTimeResult: string;
  cardRange: string;
  mvp: string;
  comment: string;
  // 하프타임 수정
  halftimeRevised?: boolean;
  // MVP 최종 제출
  finalMvp?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

const predictionsRef = () => collection(db, 'predictions');

export async function savePrediction(
  participantId: string,
  data: Omit<PredictionDoc, 'participantId' | 'createdAt' | 'updatedAt'>
) {
  const ref = doc(predictionsRef(), participantId);
  const existing = await getDoc(ref);
  await setDoc(ref, {
    ...data,
    participantId,
    updatedAt: serverTimestamp(),
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
  });
}

export async function getPrediction(participantId: string): Promise<PredictionDoc | null> {
  const snap = await getDoc(doc(predictionsRef(), participantId));
  return snap.exists() ? (snap.data() as PredictionDoc) : null;
}

export async function getAllPredictions(): Promise<PredictionDoc[]> {
  const snap = await getDocs(query(predictionsRef(), orderBy('createdAt', 'asc')));
  return snap.docs.map((d) => d.data() as PredictionDoc);
}

export function subscribePredictions(cb: (list: PredictionDoc[]) => void): Unsubscribe {
  return onSnapshot(query(predictionsRef(), orderBy('createdAt', 'asc')), (snap) => {
    cb(snap.docs.map((d) => d.data() as PredictionDoc));
  }, () => cb([]));
}
