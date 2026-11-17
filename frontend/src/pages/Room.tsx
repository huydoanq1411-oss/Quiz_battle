import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../socket';
import type { RootState } from '../store';
import { restored, reset, type GameState } from '../store/gameSlice';

function Countdown({ endsAt, serverNow, durationMs }: { endsAt: number; serverNow: number; durationMs: number }) {
  const [left, setLeft] = useState(() => Math.max(0, endsAt - serverNow));
  useEffect(() => {
    const offset = serverNow - Date.now();
    const tick = () => setLeft(Math.max(0, endsAt - Date.now() - offset));
    tick();
    const timer = setInterval(tick, 100);
    return () => clearInterval(timer);
  }, [endsAt, serverNow]);
  return <div className="timer-track"><div className={`timer-fill${left < 5000 ? ' timer-low' : ''}`} style={{ width: `${Math.min(100, left / durationMs * 100)}%` }} /></div>;
}

export default function Room() {
  const { code } = useParams();
  const nav = useNavigate();
  const dispatch = useDispatch();
  const game = useSelector((state: RootState) => state.game);
  const myId = useSelector((state: RootState) => state.auth.user?.id);
  const [connectionMessage, setConnectionMessage] = useState('Đang kết nối phòng…');
  const [connected, setConnected] = useState(false);
  const [starting, setStarting] = useState(false);
  const isHost = game.players.find((player) => player.userId === myId)?.isHost;

  useEffect(() => {
    const socket = getSocket();
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const receive = (state: GameState) => {
      if (!active || state.code !== code) return;
      dispatch(restored(state));
      setConnected(true);
      setConnectionMessage('');
      if (state.phase !== 'lobby') setStarting(false);
    };
    const joinRoom = () => {
      if (!active) return;
      setConnected(false);
      clearTimeout(retry);
      setConnectionMessage('Đang khôi phục phòng…');
      socket.timeout(90_000).emit('room:join', { code }, (error: Error | null, response?: { error?: string; retryable?: boolean; state?: GameState }) => {
        if (!active) return;
        if (error || response?.error) {
          setConnectionMessage(response?.error ?? 'Chưa kết nối được. Đang thử lại…');
          if (socket.connected && (error || response?.retryable)) retry = setTimeout(joinRoom, 3000);
          return;
        }
        if (response?.state) receive(response.state);
      });
    };
    const disconnected = () => {
      setConnected(false);
      setConnectionMessage('Mất kết nối. Đang tự kết nối lại…');
    };
    const failed = (error: Error) => {
      setConnected(false);
      setConnectionMessage(error.message === 'unauthorized' ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' : 'Máy chủ đang khởi động hoặc mất kết nối. Đang thử lại…');
    };
    socket.on('room:state', receive);
    socket.on('connect', joinRoom);
    socket.on('disconnect', disconnected);
    socket.on('connect_error', failed);
    if (socket.connected) joinRoom();
    return () => {
      active = false;
      clearTimeout(retry);
      socket.off('room:state', receive);
      socket.off('connect', joinRoom);
      socket.off('disconnect', disconnected);
      socket.off('connect_error', failed);
      dispatch(reset());
    };
  }, [code, dispatch]);

  const start = () => {
    setStarting(true);
    getSocket().timeout(90_000).emit('game:start', { code }, (error: Error | null, response?: { error?: string }) => {
      if (error || response?.error) {
        setStarting(false);
        setConnectionMessage(response?.error ?? 'Chưa bắt đầu được. Vui lòng thử lại.');
      }
    });
  };
  const choose = (choice: number) => {
    if (!connected || game.myChoice !== null || game.phase !== 'playing') return;
    getSocket().timeout(10_000).emit('game:answer', { code, index: game.question?.index, choice }, (error: Error | null, response?: { error?: string }) => {
      if (error || response?.error) setConnectionMessage(response?.error ?? 'Chưa xác nhận đáp án. Vui lòng thử lại.');
    });
  };

  if (game.phase === 'lobby' || game.phase === 'idle') {
    return (
      <div className="page room-page">
        {connectionMessage && <p role="status" className="waiting-note">{connectionMessage}</p>}
        <section className="room-lobby">
          <div className="room-lobby-main">
            <p className="eyebrow"><span className="live-dot" /> SẢNH CHỜ / {game.lang === 'JA' ? '日本語' : 'ENGLISH'}</p>
            <h1>Sẵn sàng<br /><span>chưa?</span></h1>
            <p className="page-intro">Chia sẻ mã phòng với đồng đội để họ có thể tham gia.</p>
            <div className="room-code-display"><span>MÃ PHÒNG</span><strong>{code}</strong></div>
            <div className="lobby-settings"><span>{game.mode === 'IELTS' ? 'IELTS · Điền từ' : game.mode === 'JLPT' ? 'JLPT · Kanji' : 'English · Từ vựng'}</span><strong>{game.level}</strong></div>
            {isHost ? <button className="button button-primary" onClick={start} disabled={!connected || starting}>{starting ? 'Đang chuẩn bị…' : 'Bắt đầu trận'} <span aria-hidden="true">→</span></button> : <p className="waiting-note"><span className="live-dot" /> Đang đợi chủ phòng bắt đầu...</p>}
          </div>
          <div className="room-roster">
            <div className="roster-heading"><h2>Người chơi</h2><span>{String(game.players.length).padStart(2, '0')}</span></div>
            {game.players.map((player, index) => (
              <div className="roster-row" key={player.userId}><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><span className="rank-avatar">{player.name?.charAt(0)?.toUpperCase()}</span><strong>{player.name}</strong>{player.isHost && <span className="leader-tag">HOST</span>}</div>
            ))}
            {game.players.length === 0 && <p className="empty-state">Đang kết nối người chơi...</p>}
          </div>
        </section>
      </div>
    );
  }

  if (game.phase === 'ended') {
    return (
      <div className="page room-page">
        {connectionMessage && <p role="status" className="waiting-note">{connectionMessage}</p>}
        <section className="result-heading"><p className="eyebrow">TRẬN {code} / KẾT THÚC</p><h1>Cuộc chơi<br /><span>đã ngã ngũ.</span></h1><p className="page-intro">Một trận đấu hay được tạo nên bởi những đối thủ tuyệt vời.</p></section>
        <section className="ranking-list" aria-label="Bảng kết quả">
          {game.ranking.map((player, index) => <article className={`ranking-row${index < 3 ? ` ranking-top ranking-top-${index + 1}` : ''}`} key={player.userId}><span className="ranking-person"><b className="rank-number">{String(index + 1).padStart(2, '0')}</b><span className="rank-avatar">{player.name?.charAt(0)?.toUpperCase()}</span><strong>{player.name}</strong>{index === 0 && <span className="leader-tag">WINNER</span>}</span><strong className="ranking-score">{player.score}<small> pts</small></strong></article>)}
        </section>
        <button className="button button-primary return-button" onClick={() => nav('/')}>Về sảnh chơi <span aria-hidden="true">→</span></button>
      </div>
    );
  }

  const question = game.question;
  if (!question) return <p className="loading-state">Đang chuẩn bị câu hỏi<span>...</span></p>;
  const sortedPlayers = [...game.players].sort((first, second) => second.score - first.score);

  return (
    <div className="page room-page">
        {connectionMessage && <p role="status" className="waiting-note">{connectionMessage}</p>}
      <div className="game-topline"><span className="eyebrow">TRẬN {code}</span><span className="question-count">CÂU <strong>{String(question.index + 1).padStart(2, '0')}</strong> / {String(question.total).padStart(2, '0')}</span></div>
      {game.phase === 'playing' && <Countdown key={question.index} endsAt={question.endsAt} serverNow={question.serverNow} durationMs={question.durationMs} />}
      <div className="game-layout">
        <section className="question-panel">
          <p className="eyebrow">{game.phase === 'reveal' ? 'ĐÁP ÁN ĐÃ ĐƯỢC CÔNG BỐ' : 'CHỌN CÂU TRẢ LỜI CỦA BẠN'}</p>
          <h1 lang={game.lang === 'JA' ? 'ja' : 'en'} className={game.lang === 'JA' ? 'question-text question-japanese' : 'question-text'}>{question.text}</h1>
          <div className="answer-grid">
            {question.options.map((option: string, index: number) => {
              const correct = game.phase === 'reveal' && index === game.correctIndex;
              const incorrect = game.phase === 'reveal' && index === game.myChoice && index !== game.correctIndex;
              const selected = game.phase !== 'reveal' && index === game.myChoice;
              return <button className={`answer-option${correct ? ' answer-correct' : ''}${incorrect ? ' answer-incorrect' : ''}${selected ? ' answer-selected' : ''}`} key={index} onClick={() => choose(index)} disabled={!connected || game.phase !== 'playing' || game.myChoice !== null}><span className="answer-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>{correct && <span className="answer-mark">✓</span>}</button>;
            })}
          </div>
        </section>
        <aside className="score-panel">
          <div className="roster-heading"><h2>Bảng điểm</h2><span>{String(sortedPlayers.length).padStart(2, '0')}</span></div>
          {sortedPlayers.map((player, index) => <div className="score-row" key={player.userId}><span className="score-rank">{index + 1}</span><span className="score-name">{player.name}</span><strong>{player.score}</strong>{game.phase === 'playing' && <span className={game.answered.includes(player.userId) ? 'answer-status is-done' : 'answer-status'} />}</div>)}
          <p className="score-caption">{game.phase === 'playing' ? '● Đang diễn ra' : 'Đáp án chính xác được tô sáng'}</p>
        </aside>
      </div>
    </div>
  );
}
