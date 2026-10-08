import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

type GameKind = 'time-attack' | 'daily';
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type ItemId = 'fifty-fifty' | 'extra-time' | 'hint';

interface QuestionView {
  id: string;
  mode: string;
  skill: string;
  prompt: string;
  options?: string[];
  letters?: string[];
  answerLength?: number;
  spokenText?: string;
}

interface GameView {
  id: string;
  kind: GameKind;
  level: CefrLevel;
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
  tabSwitches: number;
  usedItems: ItemId[];
  hiddenOptions: number[];
  dailyStreak?: number;
  lastAnswerCorrect?: boolean;
  questionComplete?: boolean;
  wordleFailed?: boolean;
  hint?: string;
}

const LEVELS: { value: CefrLevel; label: string }[] = [
  { value: 'A1', label: 'Sơ cấp 1' }, { value: 'A2', label: 'Sơ cấp 2' },
  { value: 'B1', label: 'Trung cấp 1' }, { value: 'B2', label: 'Trung cấp 2' },
  { value: 'C1', label: 'Nâng cao 1' }, { value: 'C2', label: 'Nâng cao 2' },
];
const ITEM_LABELS: Record<ItemId, string> = {
  'fifty-fifty': '50/50', 'extra-time': '+10 giây', hint: 'Gợi ý chữ cái',
};

export default function EnglishGame() {
  const { kind: routeKind } = useParams();
  const kind: GameKind = routeKind === 'daily' ? 'daily' : 'time-attack';
  const [level, setLevel] = useState<CefrLevel>('A1');
  const [game, setGame] = useState<GameView | null>(null);
  const [selected, setSelected] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [clockOffset, setClockOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [itemHint, setItemHint] = useState('');
  const startKey = useRef('');
  const expiryRequested = useRef(false);

  const applyGame = useCallback((next: GameView) => {
    setGame(next);
    setClockOffset(next.serverNow - Date.now());
    setError('');
  }, []);

  useEffect(() => {
    const key = `${kind}:${level}`;
    if (startKey.current === key) return;
    startKey.current = key;
    setGame(null);
    setError('');
    api.post<GameView>('/english-games/start', { kind, level })
      .then((response) => applyGame(response.data))
      .catch((reason: { response?: { data?: { message?: string } } }) => {
        setError(reason.response?.data?.message ?? 'Không thể bắt đầu lượt chơi.');
      });
  }, [applyGame, kind, level]);

  useEffect(() => {
    if (!game || game.status !== 'playing') return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((game.endsAt - (Date.now() + clockOffset)) / 1000));
      setRemaining(seconds);
      if (seconds === 0 && !expiryRequested.current) {
        expiryRequested.current = true;
        api.get<GameView>(`/english-games/${game.id}`).then((response) => applyGame(response.data));
      }
    };
    expiryRequested.current = false;
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
    setBusy(true);
    setFeedback('');
    try {
      const response = await api.post<GameView>(`/english-games/${game.id}/answer`, { answer: selected });
      applyGame(response.data);
      setFeedback(response.data.lastAnswerCorrect ? 'Chính xác! + điểm combo' : response.data.questionComplete ? 'Chưa đúng, sang câu tiếp theo.' : 'Chưa đúng, thử lại nhé.');
      setSelected('');
      if (response.data.questionComplete) setItemHint('');
    } catch {
      setError('Không gửi được câu trả lời. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const useItem = async (item: ItemId) => {
    if (!game || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await api.post<GameView>(`/english-games/${game.id}/items`, { item });
      applyGame(response.data);
      if (item === 'hint') setItemHint(response.data.hint ?? '');
    } catch (reason: any) {
      setError(reason.response?.data?.message ?? 'Không thể dùng vật phẩm này.');
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
    return <section className="english-game-page"><p className="eyebrow">THỬ THÁCH TIẾNG ANH</p><h1>Chưa thể bắt đầu.</h1><p className="page-intro">{error}</p><a className="button button-primary" href="/">Về sảnh chơi</a></section>;
  }
  if (!game) return <p className="loading-state">Đang chuẩn bị câu hỏi<span>...</span></p>;

  const choiceMode = Boolean(game.question.options);
  const canUseFifty = choiceMode && game.question.options?.length === 4;
  const progress = game.kind === 'daily' ? Math.min(100, (game.questionIndex / (game.questionTotal ?? 10)) * 100) : Math.min(100, (remaining / 60) * 100);

  return (
    <section className="english-game-page">
      <header className="english-game-heading">
        <div>
          <p className="eyebrow"><span className="live-dot" /> {kind === 'daily' ? 'THỬ THÁCH HÔM NAY' : 'TIME ATTACK'} / {game.level}</p>
          <h1>{kind === 'daily' ? 'Mỗi ngày, tiến bộ.' : '60 giây. Bứt tốc.'}</h1>
          <p className="page-intro">{kind === 'daily' ? '10 câu giống nhau cho mọi người. Hoàn thành một lần để giữ chuỗi ngày.' : 'Trả lời liên tiếp, giữ streak và tích điểm combo.'}</p>
        </div>
        <label className="game-level-picker">CẤP ĐỘ<select value={level} disabled={game.questionIndex > 0 || game.answerCount > 0} onChange={(event) => setLevel(event.target.value as CefrLevel)}>{LEVELS.map((item) => <option key={item.value} value={item.value}>{item.value} · {item.label}</option>)}</select></label>
      </header>

      <div className="game-metrics" aria-live="polite">
        <div><span>{kind === 'daily' ? 'CÂU HỎI' : 'THỜI GIAN'}</span><strong>{kind === 'daily' ? `${Math.min(game.questionIndex + (game.status === 'playing' ? 1 : 0), game.questionTotal ?? 10)} / ${game.questionTotal}` : `${remaining}s`}</strong></div>
        <div><span>ĐIỂM</span><strong>{game.score}</strong></div>
        <div><span>COMBO</span><strong>{game.streak} <small>× streak</small></strong></div>
        <div><span>ĐÚNG</span><strong>{game.correctAnswers}</strong></div>
        {kind === 'daily' && <div><span>CHUỖI NGÀY</span><strong>{game.dailyStreak ?? '—'} <small>ngày</small></strong></div>}
      </div>
      <div className="game-progress"><span style={{ width: `${progress}%` }} /></div>

      {game.status === 'finished' ? (
        <div className="game-finished">
          <p className="eyebrow">LƯỢT CHƠI ĐÃ LƯU</p>
          <h2>{kind === 'daily' ? 'Hoàn thành thử thách.' : 'Hết giờ.'}</h2>
          <p className="page-intro">Bạn đạt <strong>{game.score} điểm</strong>, đúng {game.correctAnswers} câu và có streak cao nhất {game.bestStreak}.{game.dailyStreak ? ` Chuỗi Daily Challenge: ${game.dailyStreak} ngày.` : ''}</p>
          <a className="button button-primary" href="/leaderboard">Xem bảng xếp hạng <span aria-hidden="true">→</span></a>
        </div>
      ) : (
        <div className="english-play-layout">
          <form className="english-question-panel" onSubmit={submit}>
            <div className="english-question-meta"><span>{game.question.skill}</span><span>{kind === 'daily' ? `Câu ${game.questionIndex + 1} / 10` : 'Câu tiếp theo'}</span></div>
            <h2>{game.question.prompt}</h2>
            {game.question.mode === 'letter-order' && <div className="scramble-letters" aria-label="Các chữ cái cần sắp xếp">{game.question.letters?.map((letter, index) => <span key={`${letter}-${index}`}>{letter}</span>)}</div>}
            {game.question.mode === 'wordle' && <div className="wordle-guesses" aria-label="Các lần đoán">{Array.from({ length: 6 }, (_, index) => <div key={index} className="wordle-row">{Array.from({ length: game.question.answerLength ?? 5 }, (_, letterIndex) => <span key={letterIndex}>{game.guesses[index]?.[letterIndex]?.toUpperCase() ?? ''}</span>)}</div>)}</div>}
            {game.question.options && <div className="english-options">{game.question.options.map((option, index) => {
              const hidden = game.hiddenOptions.includes(index);
              return <button key={`${option}-${index}`} className={`english-option${selected === option ? ' is-selected' : ''}`} type="button" disabled={hidden || busy} onClick={() => setSelected(option)}><b>{index + 1}</b><span>{option}</span></button>;
            })}</div>}
            {game.question.spokenText && <button className="button sound-button" type="button" onClick={speak} disabled={!soundEnabled}>▶ Nghe phát âm</button>}
            {!choiceMode && <label className="english-answer-input"><span>{game.question.mode === 'wordle' ? `Đoán từ (${game.question.answerLength} chữ cái)` : 'Câu trả lời'}</span><input autoComplete="off" autoCapitalize="off" spellCheck={false} value={selected} onChange={(event) => setSelected(event.target.value)} placeholder={game.question.mode === 'wordle' ? 'Nhập từ tiếng Anh' : 'Nhập đáp án'} maxLength={40} /></label>}
            {itemHint && <p className="item-hint">Gợi ý: bắt đầu bằng <strong>{itemHint}</strong></p>}
            {feedback && <p className={`game-feedback${feedback.startsWith('Chính xác') ? ' is-correct' : ''}`} aria-live="polite">{feedback}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary submit-answer" type="submit" disabled={!selected.trim() || busy}>{busy ? 'Đang kiểm tra…' : 'Gửi đáp án'} <span aria-hidden="true">↵</span></button>
            <p className="keyboard-hint">Phím 1–4 chọn đáp án · Enter gửi câu trả lời</p>
          </form>
          <aside className="english-tools-panel">
            <div className="tools-panel-heading"><div><p className="eyebrow">HỖ TRỢ</p><h2>Vật phẩm</h2></div><button className={`sound-toggle${soundEnabled ? ' is-on' : ''}`} type="button" title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'} aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'} onClick={() => { setSoundEnabled((enabled) => !enabled); if (soundEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }}>{soundEnabled ? '♪' : '×'}</button></div>
            <div className="item-list">
              {(['fifty-fifty', 'extra-time', 'hint'] as ItemId[]).map((item) => {
                const used = game.usedItems.includes(item);
                const unsupported = item === 'fifty-fifty' && !canUseFifty;
                return <button className="item-button" type="button" key={item} disabled={used || unsupported || busy} onClick={() => void useItem(item)}><span className="item-icon">{item === 'fifty-fifty' ? '½' : item === 'extra-time' ? '+' : 'A'}</span><span>{ITEM_LABELS[item]}<small>{used ? 'Đã dùng' : unsupported ? 'Không dùng được ở dạng này' : '1 lần mỗi lượt'}</small></span><b>{used ? '✓' : '↗'}</b></button>;
              })}
            </div>
            <div className="integrity-note"><span className="live-dot" /> Giờ và đáp án được xác thực trên máy chủ.</div>
            {game.tabSwitches > 0 && <p className="tab-warning">Đã ghi nhận chuyển tab: {game.tabSwitches}</p>}
          </aside>
        </div>
      )}
    </section>
  );
}
