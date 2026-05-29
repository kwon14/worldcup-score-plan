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
  halftimeRevised?: boolean;
  finalMvp?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

const predictionsRef = (matchId: string) => collection(db, `m${matchId}_predictions`);

export async function savePrediction(
  matchId: string,
  participantId: string,
  data: Omit<PredictionDoc, 'participantId' | 'createdAt' | 'updatedAt'>
) {
  const ref = doc(predictionsRef(matchId), participantId);
  const existing = await getDoc(ref);
  await setDoc(ref, {
    ...data,
    participantId,
    updatedAt: serverTimestamp(),
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
  });
}

export async function getPrediction(matchId: string, participantId: string): Promise<PredictionDoc | null> {
  const snap = await getDoc(doc(predictionsRef(matchId), participantId));
  return snap.exists() ? (snap.data() as PredictionDoc) : null;
}

export async function getAllPredictions(matchId: string): Promise<PredictionDoc[]> {
  const snap = await getDocs(query(predictionsRef(matchId), orderBy('createdAt', 'asc')));
  return snap.docs.map((d) => d.data() as PredictionDoc);
}

export function subscribePredictions(matchId: string, cb: (list: PredictionDoc[]) => void): Unsubscribe {
  return onSnapshot(query(predictionsRef(matchId), orderBy('createdAt', 'asc')), (snap) => {
    cb(snap.docs.map((d) => d.data() as PredictionDoc));
  }, () => cb([]));
}
