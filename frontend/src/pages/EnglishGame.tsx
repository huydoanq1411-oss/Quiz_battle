import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import WrongAnswerReview from '../WrongAnswerReview';
import type { ReviewItem } from '../review';

type GameKind = 'time-attack' | 'daily' | 'lesson' | 'challenge';
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type ItemId = 'fifty-fifty' | 'extra-time' | 'hint';
interface ApiError { response?: { status?: number; data?: { message?: string | string[] } } }

const apiErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as ApiError).response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : message ?? fallback;
};

interface QuestionView {
  id: string;
  mode: string;
  skill: string;
  prompt: string;
  options?: string[];
  letters?: string[];
  answerLength?: number;
  spokenText?: string;
  matchWords?: string[];
  matchMeanings?: string[];
}

interface GameView {
  id: string;
  kind: GameKind;
  level: CefrLevel;
  dailyDate?: string;
  status: 'playing' | 'finished';
  score: number;
  streak: number;
  bestStreak: number;
  correctAnswers: number;
  answerCount: number;
  questionIndex: number;
  questionTotal: number | null;
  endsAt: number;
  serverNow: number;
  question: QuestionView;
  guesses: string[];
  guessFeedback?: ('correct' | 'present' | 'absent')[][];
  tabSwitches: number;
  usedItems: ItemId[];
  hiddenOptions: number[];
  dailyStreak?: number;
  lastAnswerCorrect?: boolean;
  questionComplete?: boolean;
  wordleFailed?: boolean;
  hint?: string;
  review?: ReviewItem[];
  topic?: string;
  challengeId?: string;
  dailyGoalMet?: boolean;
  weeklyDays?: number;
  finishReason?: 'pool-exhausted';
}

interface ChallengeInfo { id: string; level: CefrLevel; topic?: string; expiresAt: number; sessionId?: string; ranking: { userId: number; name: string; correct: number; elapsedMs: number }[] }
interface Progress { days: number; badge: string | null }

const LEVELS: { value: CefrLevel; label: string }[] = [
  { value: 'A1', label: 'Sơ cấp 1' }, { value: 'A2', label: 'Sơ cấp 2' },
  { value: 'B1', label: 'Trung cấp 1' }, { value: 'B2', label: 'Trung cấp 2' },
  { value: 'C1', label: 'Nâng cao 1' }, { value: 'C2', label: 'Nâng cao 2' },
];
const ITEM_LABELS: Record<ItemId, string> = {
  'fifty-fifty': '50/50', 'extra-time': '+10 giây', hint: 'Gợi ý chữ cái',
};

const storageKey = (userId: number | undefined, gameKind: GameKind, dailyDate?: string, topic?: string, level?: string) =>
  gameKind === 'daily'
    ? `quiz-battle:english-game:${userId}:daily:${dailyDate ?? new Date().toISOString().slice(0, 10)}`
    : `quiz-battle:english-game:${userId}:${gameKind}:${gameKind === 'challenge' ? 'latest' : `${topic ?? 'all'}:${level}`}`;

export default function EnglishGame() {
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const { kind: routeKind, challengeId } = useParams();
  const [search] = useSearchParams();
  const [topic, setTopic] = useState<string | undefined>(search.get('topic') ?? undefined);
  const kind: GameKind = challengeId ? 'challenge' : routeKind === 'daily' ? 'daily' : routeKind === 'lesson' ? 'lesson' : 'time-attack';
  const [level, setLevel] = useState<CefrLevel>((search.get('level') ?? 'A1') as CefrLevel);
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [weekly, setWeekly] = useState<Progress | null>(null);
  const [game, setGame] = useState<GameView | null>(null);
  const [selected, setSelected] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [clockOffset, setClockOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [itemHint, setItemHint] = useState('');
  const expiryRequested = useRef(false);
  const expiryRetryAt = useRef(0);
  const applyGame = useCallback((next: GameView) => {
    setGame(next);
    setClockOffset(next.serverNow - Date.now());
    setError('');
    localStorage.setItem(storageKey(userId, next.kind, next.dailyDate, next.topic, next.level), next.id);
  }, [userId]);
  const title = kind === 'daily' ? 'Mỗi ngày, tiến bộ.' : kind === 'lesson' ? 'Học theo chủ đề.' : kind === 'challenge' ? 'Lời thách đấu.' : '60 giây. Bứt tốc.';
  const intro = kind === 'daily' ? 'Hoàn thành đủ 10 câu, đúng ít nhất 8 câu để đạt mục tiêu hôm nay. Tuần tính theo UTC.' : kind === 'lesson' ? `${({ travel: 'Du lịch', work: 'Công việc', life: 'Đời sống' } as Record<string, string>)[topic ?? ''] ?? 'Tổng hợp'} · 10 câu, tối đa 10 phút. Đúng 8/10 để đánh dấu đã đạt.` : kind === 'challenge' ? '10 câu chung · 150 giây · mỗi tài khoản một lượt. Xếp theo số câu đúng rồi thời gian.' : 'Trả lời liên tiếp, giữ streak và tích điểm combo.';

  useEffect(() => {
    let active = true;
    if (kind === 'daily') void api.get<Progress>('/english-games/progress').then(({ data }) => { if (active) setWeekly(data); }).catch(() => undefined);
    return () => { active = false; };
  }, [kind, game?.status]);

  useEffect(() => {
    if (!challengeId) return;
    let active = true;
    void api.get<ChallengeInfo>(`/english-games/challenges/${challengeId}`).then(async ({ data }) => {
      if (!active) return;
      setChallenge(data);
      if (data.sessionId) {
        const response = await api.get<GameView>(`/english-games/${data.sessionId}`);
        if (active) applyGame(response.data);
      }
    }).catch((reason: unknown) => { if (active) setError(apiErrorMessage(reason, 'Chưa tải được thách đấu.')); });
    return () => { active = false; };
  }, [challengeId, applyGame]);

  useEffect(() => {
    if (!challengeId || game?.status !== 'finished') return;
    let active = true;
    void api.get<ChallengeInfo>(`/english-games/challenges/${challengeId}`).then(({ data }) => {
      if (active) setChallenge(data);
    }).catch(() => { if (active) setError('Chưa cập nhật được bảng kết quả.'); });
    return () => { active = false; };
  }, [challengeId, game?.status]);

  useEffect(() => {
    if (kind === 'challenge') return;
    const key = storageKey(userId, kind, undefined, topic, level);
    const savedId = localStorage.getItem(key) ?? (kind === 'time-attack' ? localStorage.getItem(`quiz-battle:english-game:${userId}:time-attack:latest`) : null);
    if (!savedId) return;
    let active = true;
    api.get<GameView>(`/english-games/${savedId}`).then((response) => {
      if (!active) return;
      if (kind !== 'daily' && (response.data.topic !== topic || response.data.level !== level)) return;
      applyGame(response.data);
    }).catch((reason: unknown) => {
      if (!active) return;
      if ((reason as ApiError).response?.status === 404) localStorage.removeItem(key);
      else setError('Chưa tải được lượt chơi đã lưu. Kiểm tra kết nối rồi thử lại.');
    });
    return () => { active = false; };
  }, [applyGame, kind, userId, topic, level]);

  const startGame = async () => {
    setBusy(true);
    setError('');
    try {
      const response = challengeId
        ? await api.post<GameView>(`/english-games/challenges/${challengeId}/join`)
        : await api.post<GameView>('/english-games/start', { kind, level: kind === 'daily' ? 'B1' : level, topic });
      applyGame(response.data);
    } catch (reason: unknown) {
      setError(apiErrorMessage(reason, 'Không thể bắt đầu lượt chơi.'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!game || game.status !== 'playing') return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((game.endsAt - (Date.now() + clockOffset)) / 1000));
      setRemaining(seconds);
      if (seconds === 0 && !expiryRequested.current && Date.now() >= expiryRetryAt.current) {
        expiryRequested.current = true;
        void api.get<GameView>(`/english-games/${game.id}`).then((response) => applyGame(response.data)).catch(() => {
          expiryRequested.current = false;
          expiryRetryAt.current = Date.now() + 2000;
          setError('Chưa lưu được kết quả. Đang thử lại…');
        });
      }
    };
    expiryRequested.current = false;
    expiryRetryAt.current = 0;
    tick();
    const timer = window.setInterval(tick, 150);
    return () => window.clearInterval(timer);
  }, [applyGame, clockOffset, game]);

  useEffect(() => {
    if (game?.status !== 'playing') return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void api.post(`/english-games/${game.id}/tab-hidden`).catch(() => undefined);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [game?.id, game?.status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!game?.question.options || event.target instanceof HTMLInputElement) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < game.question.options.length && !game.hiddenOptions.includes(index)) {
        setSelected(game.question.options[index]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game]);

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!game || !selected.trim() || busy || game.status !== 'playing') return;
    if (game.question.matchWords && (!/^[123]-[123]-[123]$/.test(selected) || new Set(selected.split('-')).size !== 3)) return;
    setBusy(true);
    setFeedback('');
    try {
      const response = await api.post<GameView>(`/english-games/${game.id}/answer`, { questionId: game.question.id, answer: selected });
      applyGame(response.data);
      setFeedback(response.data.lastAnswerCorrect ? 'Chính xác! + điểm combo' : response.data.questionComplete ? 'Chưa đúng, sang câu tiếp theo.' : 'Chưa đúng, thử lại nhé.');
      setSelected('');
      if (response.data.questionComplete) setItemHint('');
    } catch {
      setError('Không gửi được câu trả lời. Vui lòng thử lại.');
      try {
        const response = await api.get<GameView>(`/english-games/${game.id}`);
        applyGame(response.data);
        if (response.data.question.id !== game.question.id) {
          setSelected('');
          setItemHint('');
          setFeedback('Đã đồng bộ câu hỏi mới nhất.');
        }
      } catch {
        // Keep the answer so it can be retried when the connection returns.
      }
    } finally {
      setBusy(false);
    }
  };

  const handleUseItem = async (item: ItemId) => {
    if (!game || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await api.post<GameView>(`/english-games/${game.id}/items`, { item });
      applyGame(response.data);
      if (item === 'hint') setItemHint(response.data.hint ?? '');
    } catch (reason: unknown) {
      setError(apiErrorMessage(reason, 'Không thể dùng vật phẩm này.'));
    } finally {
      setBusy(false);
    }
  };

  const speak = () => {
    const text = game?.question.spokenText;
    if (!text || !soundEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (error && !game) {
    return <section className="english-game-page"><p className="eyebrow">THỬ THÁCH TIẾNG ANH</p><h1>Chưa bắt đầu được lượt chơi.</h1><p className="page-intro">{error}</p><button className="button button-primary" type="button" onClick={() => window.location.reload()}>Thử lại</button><Link className="button button-quiet" to="/learn">Chọn chủ đề/cấp độ khác</Link><Link className="button button-quiet" to="/">Về sảnh chơi</Link></section>;
  }
  if (!game) return (
    <section className="english-game-page">
      <header className="english-game-heading">
        <div><p className="eyebrow"><span className="live-dot" /> {kind.toUpperCase()}</p><h1>{title}</h1><p className="page-intro">{intro}</p></div>
        <label className="game-level-picker">CẤP ĐỘ<select value={kind === 'daily' ? 'B1' : challenge?.level ?? level} disabled={kind === 'daily' || kind === 'challenge'} onChange={(event) => setLevel(event.target.value as CefrLevel)}>{LEVELS.map((item) => <option key={item.value} value={item.value}>{item.value} · {item.label}</option>)}</select></label>
      </header>
      {kind === 'time-attack' && <label className="field-group"><span>CHỦ ĐỀ</span><select className="topic-select" value={topic ?? ''} onChange={event => setTopic(event.target.value || undefined)}><option value="">Tổng hợp</option><option value="travel">Du lịch</option><option value="work">Công việc</option><option value="life">Đời sống</option></select></label>}
      <div className="game-finished game-setup"><p className="eyebrow">SẴN SÀNG?</p><h2>{title} · {kind === 'daily' ? 'B1' : challenge?.level ?? level}</h2><p className="page-intro">{intro}</p>{weekly && <p>Tuần này đạt {weekly.days}/7 ngày · Huy hiệu: {weekly.badge ?? 'Chưa có'} · Đồng 3 / Bạc 5 / Vàng 7 ngày.</p>}{challenge && <p>Link hết hạn: {new Date(challenge.expiresAt).toLocaleString('vi-VN')}.</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" type="button" disabled={busy || (kind === 'challenge' && !challenge)} onClick={() => void startGame()}>{busy ? 'Đang bắt đầu…' : 'Bắt đầu chơi'} <span aria-hidden="true">→</span></button></div>
    </section>
  );

  const choiceMode = Boolean(game.question.options);
  const matchingMode = Boolean(game.question.matchWords && game.question.matchMeanings);
  const answerReady = Boolean(selected.trim()) && (!matchingMode || (/^[123]-[123]-[123]$/.test(selected) && new Set(selected.split('-')).size === 3));
  const canUseFifty = choiceMode && game.question.options?.length === 4;
  const progress = game.questionTotal !== null ? Math.min(100, (game.questionIndex / (game.questionTotal ?? 10)) * 100) : Math.min(100, (remaining / 60) * 100);

  return (
    <section className="english-game-page">
      <header className="english-game-heading">
        <div>
          <p className="eyebrow"><span className="live-dot" /> {kind === 'daily' ? 'DAILY' : kind === 'lesson' ? 'LỘ TRÌNH' : kind === 'challenge' ? 'THÁCH ĐẤU QUA LINK' : 'TIME ATTACK'} / {game.level}</p>
          <h1>{title}</h1>
          <p className="page-intro">{intro}</p>
          {kind !== 'daily' && <p>Chủ đề: {({ travel: 'Du lịch', work: 'Công việc', life: 'Đời sống' } as Record<string, string>)[game.topic ?? ''] ?? 'Tổng hợp'} · Câu mới theo lịch sử của tài khoản.</p>}
        </div>
        <label className="game-level-picker">CẤP ĐỘ<select value={kind === 'daily' ? 'B1' : game?.level ?? level} disabled={kind !== 'time-attack' || game.status === 'playing'} onChange={(event) => { setLevel(event.target.value as CefrLevel); setGame(null); }}>{LEVELS.map((item) => <option key={item.value} value={item.value}>{item.value} · {item.label}</option>)}</select></label>
      </header>

      <div className="game-metrics" aria-live="polite">
        <div><span>{game.questionTotal ? 'CÂU HỎI / THỜI GIAN' : 'THỜI GIAN'}</span><strong>{game.questionTotal ? `${Math.min(game.questionIndex + (game.status === 'playing' ? 1 : 0), game.questionTotal ?? 10)} / ${game.questionTotal}${game.status === 'playing' ? ` (${remaining}s)` : ''}` : `${remaining}s`}</strong></div>
        <div><span>ĐIỂM</span><strong>{game.score}</strong></div>
        <div><span>COMBO</span><strong>{game.streak} <small>× streak</small></strong></div>
        <div><span>ĐÚNG</span><strong>{game.correctAnswers}</strong></div>
        {kind === 'daily' && <div><span>CHUỖI NGÀY</span><strong>{game.dailyStreak ?? '—'} <small>ngày</small></strong></div>}
      </div>
      <div className="game-progress"><span style={{ width: `${progress}%` }} /></div>

      {game?.status === 'finished' ? (
        <>
        <div className="game-finished">
          <p className="eyebrow">LƯỢT CHƠI ĐÃ LƯU</p>
          <h2>{game.finishReason === 'pool-exhausted' ? 'Đã hết câu mới cho lựa chọn này.' : kind === 'time-attack' ? 'Hết giờ.' : 'Kết quả lượt chơi.'}</h2>
          {game.finishReason === 'pool-exhausted' && <Link className="button button-quiet" to="/learn">Đổi chủ đề/cấp độ</Link>}
          <p className="page-intro">Bạn đạt <strong>{game.score} điểm</strong>, đúng {game.correctAnswers} câu và có streak cao nhất {game.bestStreak}.{game.dailyStreak ? ` Chuỗi Daily Challenge: ${game.dailyStreak} ngày.` : ''}</p>
          {kind === 'daily' && <p>{game.dailyGoalMet ? '✓ Đạt mục tiêu 8/10!' : 'Chưa đạt mục tiêu: cần hoàn thành 10 câu và đúng ít nhất 8 câu.'} Tuần này: {weekly?.days ?? game.weeklyDays ?? 0}/7 ngày đạt · Huy hiệu {weekly?.badge ?? ((game.weeklyDays ?? 0) >= 7 ? 'Vàng' : (game.weeklyDays ?? 0) >= 5 ? 'Bạc' : (game.weeklyDays ?? 0) >= 3 ? 'Đồng' : 'chưa có')}. Đồng 3 / Bạc 5 / Vàng 7 ngày.</p>}
          {kind === 'lesson' && <><p>{game.questionIndex >= 10 && game.correctAnswers >= 8 ? '✓ Đã đạt cấp độ này.' : 'Luyện lại để đạt 8/10 nhé.'}</p><Link className="button button-primary" to="/learn">Chọn bài tiếp theo</Link><button className="button button-quiet" disabled={busy} onClick={() => void startGame()}>Luyện bài mới</button></>}
          {kind === 'challenge' && <div className="challenge-results"><label className="field-group">LINK THÁCH ĐẤU<input readOnly value={`${window.location.origin}/challenges/${challengeId}`} onFocus={event => event.target.select()} /></label><button className="button button-primary" onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/challenges/${challengeId}`).then(() => setFeedback('Đã sao chép link.')).catch(() => setFeedback('Hãy chọn và sao chép link bên trên.')); }}>Sao chép link</button><p role="status">{feedback}</p><h3>Kết quả đã hoàn thành</h3>{challenge?.ranking.map(player => <p key={player.userId}><strong>{player.name}</strong> · {player.correct}/10 · {(player.elapsedMs / 1000).toFixed(1)} giây</p>)}<button className="button button-quiet" onClick={() => { void api.get<ChallengeInfo>(`/english-games/challenges/${challengeId}`).then(({ data }) => setChallenge(data)).catch(() => setError('Chưa tải được kết quả.')); }}>Cập nhật kết quả</button></div>}
          {(kind === 'time-attack' || kind === 'daily') && <Link className="button button-primary" to="/leaderboard">Xem bảng xếp hạng <span aria-hidden="true">→</span></Link>}
          {kind === 'challenge' && <Link className="button button-quiet" to="/">Về sảnh chơi</Link>}
          {game.kind === 'time-attack' && <button className="button button-quiet" type="button" disabled={busy} onClick={() => void startGame()}>{busy ? 'Đang bắt đầu…' : 'Chơi lượt mới'}</button>}
          {game.kind === 'time-attack' && <button className="button button-quiet" type="button" onClick={() => { setGame(null); setError(''); }}>Chọn chủ đề/cấp độ khác</button>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <WrongAnswerReview key={game.id} items={game.review} />
        </>
      ) : game?.status === 'playing' ? (
        <div className="english-play-layout">
          <form className="english-question-panel" onSubmit={submit}>
            <div className="english-question-meta"><span>{game.question.skill}</span><span>{game.questionTotal ? `Câu ${game.questionIndex + 1} / 10` : 'Câu tiếp theo'}</span></div>
            <h2>{matchingMode ? 'Ghép mỗi từ với nghĩa phù hợp.' : game.question.prompt}</h2>
            {matchingMode && <div className="matching-fields">{game.question.matchWords?.map((word, index) => <label className="field-group" key={index}><span>{String.fromCharCode(65 + index)}. {word}</span><select value={selected.split('-')[index] ?? ''} disabled={busy} onChange={event => { const parts = Array.from({ length: 3 }, (_, i) => selected.split('-')[i] ?? ''); parts[index] = event.target.value; setSelected(parts.join('-')); }}><option value="">Chọn nghĩa</option>{game.question.matchMeanings?.map((meaning, meaningIndex) => <option key={meaningIndex} value={String(meaningIndex + 1)} disabled={selected.split('-').some((part, partIndex) => partIndex !== index && part === String(meaningIndex + 1))}>{meaningIndex + 1}. {meaning}</option>)}</select></label>)}</div>}
            {game.question.mode === 'letter-order' && <div className="scramble-letters" aria-label="Các chữ cái cần sắp xếp">{game.question.letters?.map((letter, index) => <span key={`${letter}-${index}`}>{letter}</span>)}</div>}
            {game.question.mode === 'sentence-order' && <div className="sentence-tokens"><p>Bấm từ để ghép câu hoặc gõ trực tiếp bên dưới.</p>{game.question.letters?.map((word, index) => <button className="button button-quiet" type="button" disabled={busy} key={index} onClick={() => setSelected(previous => `${previous} ${word}`.trim())}>{word}</button>)}<button className="button button-quiet" type="button" onClick={() => setSelected('')}>Xóa câu</button></div>}
            {game.question.mode === 'wordle' && <div className="wordle-guesses" aria-label="Các lần đoán">{Array.from({ length: 6 }, (_, index) => <div key={index} className="wordle-row">{Array.from({ length: game.question.answerLength ?? 5 }, (_, letterIndex) => <span className={game.guessFeedback?.[index]?.[letterIndex] ?? ''} key={letterIndex}>{game.guesses[index]?.[letterIndex]?.toUpperCase() ?? ''}</span>)}</div>)}</div>}
            {game.question.options && <div className="english-options">{game.question.options.map((option, index) => {
              const hidden = game.hiddenOptions.includes(index);
              return <button key={`${option}-${index}`} className={`english-option${selected === option ? ' is-selected' : ''}`} type="button" disabled={hidden || busy} onClick={() => setSelected(option)}><b>{index + 1}</b><span>{option}</span></button>;
            })}</div>}
            {game.question.spokenText && <button className="button sound-button" type="button" onClick={speak} disabled={!soundEnabled}>▶ Nghe phát âm</button>}
            {!choiceMode && !matchingMode && <label className="english-answer-input"><span>{game.question.mode === 'wordle' ? `Đoán từ (${game.question.answerLength} chữ cái)` : game.question.mode === 'word-match' ? 'Ba số theo thứ tự A-B-C (ví dụ 2-3-1)' : 'Câu trả lời'}</span><input autoComplete="off" autoCapitalize="off" spellCheck={false} value={selected} onChange={(event) => setSelected(event.target.value)} placeholder={game.question.mode === 'wordle' ? 'Nhập từ tiếng Anh' : 'Nhập đáp án'} maxLength={300} /></label>}
            {itemHint && <p className="item-hint">Gợi ý: bắt đầu bằng <strong>{itemHint}</strong></p>}
            {feedback && <p className={`game-feedback${feedback.startsWith('Chính xác') ? ' is-correct' : ''}`} aria-live="polite">{feedback}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary submit-answer" type="submit" disabled={!answerReady || busy}>{busy ? 'Đang kiểm tra…' : 'Gửi đáp án'} <span aria-hidden="true">↵</span></button>
            <p className="keyboard-hint">{choiceMode ? 'Phím 1–4 chọn đáp án · Enter gửi câu trả lời' : matchingMode ? 'Chọn đủ ba nghĩa khác nhau rồi gửi đáp án.' : 'Nhập đáp án · Enter gửi câu trả lời'}</p>
          </form>
          <aside className="english-tools-panel">
            <div className="tools-panel-heading"><div><p className="eyebrow">HỖ TRỢ</p><h2>Vật phẩm</h2></div><button className={`sound-toggle${soundEnabled ? ' is-on' : ''}`} type="button" title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'} aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'} onClick={() => { setSoundEnabled((enabled) => !enabled); if (soundEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }}>{soundEnabled ? '♪' : '×'}</button></div>
            <div className="item-list">
              {(kind === 'time-attack' ? ['fifty-fifty', 'extra-time', 'hint'] as ItemId[] : []).map((item) => {
                const used = game.usedItems.includes(item);
                const unsupported = item === 'fifty-fifty' && !canUseFifty;
                return <button className="item-button" type="button" key={item} disabled={used || unsupported || busy} onClick={() => void handleUseItem(item)}><span className="item-icon">{item === 'fifty-fifty' ? '½' : item === 'extra-time' ? '+' : 'A'}</span><span>{ITEM_LABELS[item]}<small>{used ? 'Đã dùng' : unsupported ? 'Không dùng được ở dạng này' : '1 lần mỗi lượt'}</small></span><b>{used ? '✓' : '↗'}</b></button>;
              })}
            </div>
            {kind !== 'time-attack' && <p>Không dùng vật phẩm trong lượt này.</p>}
            <div className="integrity-note"><span className="live-dot" /> Giờ và đáp án được xác thực trên máy chủ.</div>
            {game.tabSwitches > 0 && <p className="tab-warning">Đã ghi nhận chuyển tab: {game.tabSwitches}</p>}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
