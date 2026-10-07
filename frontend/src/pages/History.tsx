import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

interface MatchHistoryRow {
  id: number;
  matchId: number;
  rank: number;
  score: number;
  match: { language: 'EN' | 'JA' };
}

export default function History() {
  const [rows, setRows] = useState<MatchHistoryRow[]>([]);
  useEffect(() => { api.get('/matches/mine').then((response) => setRows(response.data)); }, []);

  return (
    <div className="page">
      <section className="list-page-heading">
        <div><p className="eyebrow">HỒ SƠ NGƯỜI CHƠI / ARCHIVE</p><h1>Lịch sử trận<span>.</span></h1><p className="page-intro">Xem lại hành trình và những lần bạn chiếm ưu thế.</p></div>
        <span className="history-count">{String(rows.length).padStart(2, '0')} <small>TRẬN</small></span>
      </section>
      <section className="match-list" aria-label="Các trận đã chơi">
        {rows.map((row, index) => (
          <Link className="match-row" to={`/matches/${row.matchId}`} key={row.id}>
            <span className="match-row-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="language-chip">{row.match.language === 'JA' ? '日本語' : 'ENGLISH'}</span>
            <span className="match-result">Hạng <strong>{row.rank}</strong></span>
            <strong className="match-points">{row.score}<small> pts</small></strong>
            <span className="match-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
        {rows.length === 0 && <p className="empty-state">Chưa có trận đấu nào. Sảnh chơi đang chờ bạn.</p>}
      </section>
    </div>
  );
}
