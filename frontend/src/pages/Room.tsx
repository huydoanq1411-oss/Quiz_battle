import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../socket';
import type { RootState } from '../store';
import { joined, setPlayers, questionReceived, chose, answeredBy, revealed, ended, reset } from '../store/gameSlice';

const EVENTS = ['room:players', 'game:question', 'game:answered', 'game:reveal', 'game:end'];

function Countdown({ ms }: { ms: number }) {
  const [left, setLeft] = useState(ms);
  useEffect(() => {
    const end = Date.now() + ms;
    const timer = setInterval(() => setLeft(Math.max(0, end - Date.now())), 100);
    return () => clearInterval(timer);
  }, [ms]);
  return <div className="timer-track"><div className={`timer-fill${left < 5000 ? ' timer-low' : ''}`} style={{ width: `${(left / ms) * 100}%` }} /></div>;
}

export default function Room() {
  const { code } = useParams();
  const nav = useNavigate();
  const dispatch = useDispatch();
  const game = useSelector((state: RootState) => state.game);
  const myId = useSelector((state: RootState) => state.auth.user?.id);
  const isHost = game.players.find((player) => player.userId === myId)?.isHost;

  useEffect(() => {
    const socket = getSocket();
    socket.emit('room:join', { code }, (response: { error?: string; lang: 'EN' | 'JA'; mode: 'VOCAB' | 'IELTS' | 'JLPT'; level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'A1-A2' | 'B1-B2' | 'C1-C2' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1' }) => {
      if (response.error) { alert(response.error); nav('/'); }
      else dispatch(joined({ lang: response.lang, mode: response.mode, level: response.level }));
    });
    socket.on('room:players', (players) => dispatch(setPlayers(players)));
    socket.on('game:question', (question) => dispatch(questionReceived(question)));
    socket.on('game:answered', ({ userId }) => dispatch(answeredBy(userId)));
    socket.on('game:reveal', (result) => dispatch(revealed(result)));
    socket.on('game:end', ({ ranking }) => dispatch(ended(ranking)));
    return () => { EVENTS.forEach((event) => socket.off(event)); dispatch(reset()); };
  }, [code, dispatch, nav]);

  const start = () => getSocket().emit('game:start', { code }, (response: { error?: string }) => response?.error && alert(response.error));
  const choose = (choice: number) => {
    if (game.myChoice !== null || game.phase !== 'playing') return;
    dispatch(chose(choice));
    getSocket().emit('game:answer', { code, choice });
  };

  if (game.phase === 'lobby' || game.phase === 'idle') {
    return (
      <div className="page room-page">
        <section className="room-lobby">
          <div className="room-lobby-main">
            <p className="eyebrow"><span className="live-dot" /> SẢNH CHỜ / {game.lang === 'JA' ? '日本語' : 'ENGLISH'}</p>
            <h1>Sẵn sàng<br /><span>chưa?</span></h1>
            <p className="page-intro">Chia sẻ mã phòng với đồng đội để họ có thể tham gia.</p>
            <div className="room-code-display"><span>MÃ PHÒNG</span><strong>{code}</strong></div>
            <div className="lobby-settings"><span>{game.mode === 'IELTS' ? 'IELTS · Điền từ' : game.mode === 'JLPT' ? 'JLPT · Kanji' : 'English · Từ vựng'}</span><strong>{game.level}</strong></div>
            {isHost ? <button className="button button-primary" onClick={start}>Bắt đầu trận <span aria-hidden="true">→</span></button> : <p className="waiting-note"><span className="live-dot" /> Đang đợi chủ phòng bắt đầu...</p>}
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
      <div className="game-topline"><span className="eyebrow">TRẬN {code}</span><span className="question-count">CÂU <strong>{String(question.index + 1).padStart(2, '0')}</strong> / {String(question.total).padStart(2, '0')}</span></div>
      {game.phase === 'playing' && <Countdown key={question.index} ms={question.durationMs} />}
      <div className="game-layout">
        <section className="question-panel">
          <p className="eyebrow">{game.phase === 'reveal' ? 'ĐÁP ÁN ĐÃ ĐƯỢC CÔNG BỐ' : 'CHỌN CÂU TRẢ LỜI CỦA BẠN'}</p>
          <h1 lang={game.lang === 'JA' ? 'ja' : 'en'} className={game.lang === 'JA' ? 'question-text question-japanese' : 'question-text'}>{question.text}</h1>
          <div className="answer-grid">
            {question.options.map((option: string, index: number) => {
              const correct = game.phase === 'reveal' && index === game.correctIndex;
              const incorrect = game.phase === 'reveal' && index === game.myChoice && index !== game.correctIndex;
              const selected = game.phase !== 'reveal' && index === game.myChoice;
              return <button className={`answer-option${correct ? ' answer-correct' : ''}${incorrect ? ' answer-incorrect' : ''}${selected ? ' answer-selected' : ''}`} key={index} onClick={() => choose(index)} disabled={game.phase !== 'playing' || game.myChoice !== null}><span className="answer-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>{correct && <span className="answer-mark">✓</span>}</button>;
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
