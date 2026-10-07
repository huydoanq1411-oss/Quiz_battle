import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

interface MatchPlayer { id: number; score: number; user: { name: string } }
interface MatchDetails { code: string; language: 'EN' | 'JA'; totalQuestions: number; players: MatchPlayer[] }

export default function MatchDetail() {
  const { id } = useParams();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  useEffect(() => { api.get(`/matches/${id}`).then((response) => setMatch(response.data)); }, [id]);
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
            <span className="ranking-person"><b className="rank-number">{String(index + 1).padStart(2, '0')}</b><span className="rank-avatar">{player.user.name?.charAt(0)?.toUpperCase()}</span><strong>{player.user.name}</strong>{index === 0 && <span className="leader-tag">WINNER</span>}</span>
            <span />
            <strong className="ranking-score">{player.score}<small> pts</small></strong>
          </article>
        ))}
      </section>
    </div>
  );
}
