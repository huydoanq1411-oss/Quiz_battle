import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import WrongAnswerReview from '../WrongAnswerReview';
import type { ReviewItem } from '../review';

interface MatchPlayer { id: number; score: number; rank?: number; user: { name: string }; correct?: number; responseMs?: number }
interface MatchDetails { code: string; language: 'EN' | 'JA'; totalQuestions: number; players: MatchPlayer[]; review?: ReviewItem[] | null; duel?: boolean }

export default function MatchDetail() {
  const { id } = useParams();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.get(`/matches/${id}`).then(response => {
      if (active) { setMatch(response.data); setError(''); }
    }).catch(() => {
      if (active) setError('Chưa tải được kết quả và câu cần ôn. Vui lòng thử lại sau.');
    });
    return () => { active = false; };
  }, [id]);
  if (error) return <section className="page"><p className="form-error" role="alert">{error}</p><Link className="button button-primary" to="/history">Về lịch sử</Link></section>;
  if (!match) return <p className="loading-state">Đang tải kết quả<span>...</span></p>;

  return (
    <div className="page">
      <section className="list-page-heading">
        <div><p className="eyebrow">KẾT QUẢ TRẬN / {match.code}</p><h1>Trận đấu<span>.</span></h1><p className="page-intro">{match.language === 'JA' ? '日本語' : 'English'} <i>·</i> {match.totalQuestions} câu hỏi</p></div>
        <span className="detail-stamp">FINAL<br />SCORE</span>
      </section>
      <section className="ranking-list" aria-label="Kết quả người chơi">
        <div className="ranking-header"><span>HẠNG / NGƯỜI CHƠI</span><span></span><span>ĐIỂM</span></div>
        {match.players.map((player, index) => (
          <article className={`ranking-row${index === 0 ? ' ranking-top ranking-top-1' : ''}`} key={player.id}>
            <span className="ranking-person"><b className="rank-number">{String(index + 1).padStart(2, '0')}</b><span className="rank-avatar">{player.user.name?.charAt(0)?.toUpperCase()}</span><strong>{player.user.name}</strong>{index === 0 && !(match.duel && match.players[1]?.rank === player.rank) && <span className="leader-tag">WINNER</span>}</span>
            <span />
            <strong className="ranking-score">{player.score}<small> pts</small></strong>
          </article>
        ))}
      </section>
      {match.duel && <section className="game-finished"><h2>Độ chính xác và tốc độ</h2>{match.players.map(player => <p key={player.id}><strong>{player.user.name}</strong> · {player.correct}/{match.totalQuestions} câu · {Math.round((player.correct ?? 0) / match.totalQuestions * 100)}% · {((player.responseMs ?? 0) / 1000).toFixed(1)} giây</p>)}</section>}
      <WrongAnswerReview key={id} items={match.review} />
    </div>
  );
}
