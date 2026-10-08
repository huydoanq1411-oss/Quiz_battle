import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PlayerInfo { userId: number; name: string; score: number; isHost: boolean }
interface Q { index: number; total: number; text: string; options: string[]; durationMs: number }
interface Rank { rank: number; userId: number; name: string; score: number }
type QuizMode = 'VOCAB' | 'IELTS' | 'JLPT';
type QuizLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

interface GameState {
  phase: 'idle' | 'lobby' | 'playing' | 'reveal' | 'ended';
  lang: 'EN' | 'JA' | null;
  mode: QuizMode | null;
  level: QuizLevel | null;
  players: PlayerInfo[];
  question: Q | null;
  myChoice: number | null;
  answered: number[];
  correctIndex: number | null;
  ranking: Rank[];
}

const initial: GameState = {
  phase: 'idle', lang: null, mode: null, level: null, players: [], question: null,
  myChoice: null, answered: [], correctIndex: null, ranking: [],
};

const slice = createSlice({
  name: 'game',
  initialState: initial,
  reducers: {
    joined: (s, a: PayloadAction<{ lang: 'EN' | 'JA'; mode: QuizMode; level: QuizLevel }>) => {
      s.phase = 'lobby'; s.lang = a.payload.lang; s.mode = a.payload.mode; s.level = a.payload.level;
    },
    setPlayers: (s, a: PayloadAction<PlayerInfo[]>) => { s.players = a.payload; },
    questionReceived: (s, a: PayloadAction<Q>) => {
      s.phase = 'playing'; s.question = a.payload;
      s.myChoice = null; s.answered = []; s.correctIndex = null;
    },
    chose: (s, a: PayloadAction<number>) => { s.myChoice = a.payload; },
    answeredBy: (s, a: PayloadAction<number>) => { s.answered.push(a.payload); },
    revealed: (s, a: PayloadAction<{ correctIndex: number; players: PlayerInfo[] }>) => {
      s.phase = 'reveal'; s.correctIndex = a.payload.correctIndex; s.players = a.payload.players;
    },
    ended: (s, a: PayloadAction<Rank[]>) => { s.phase = 'ended'; s.ranking = a.payload; },
    reset: () => initial,
  },
});
export const { joined, setPlayers, questionReceived, chose, answeredBy, revealed, ended, reset } = slice.actions;
export default slice.reducer;
