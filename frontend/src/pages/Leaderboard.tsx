import { useEffect, useState } from 'react';
import api from '../api';

interface LeaderboardRow { name: string; total: number; games: number }

export default function Leaderboard() {
  const [lang, setLang] = useState<'EN' | 'JA'>('EN');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    api.get('/matches/leaderboard', { params: { lang } }).then((response) => setRows(response.data));
  }, [lang]);

  return (
    <div className="page">
      <section className="list-page-heading">
        <div><p className="eyebrow">CỘNG ĐỒNG / MÙA GIẢI 2026</p><h1>Bảng xếp hạng<span>.</span></h1><p className="page-intro">Những bộ óc nhanh nhất đang dẫn đầu cuộc chơi.</p></div>
        <div className="segmented-control compact-segments" role="group" aria-label="Lọc bảng xếp hạng">
          <button className={lang === 'EN' ? 'segment is-active' : 'segment'} onClick={() => setLang('EN')} aria-pressed={lang === 'EN'}>English</button>
          <button className={lang === 'JA' ? 'segment is-active' : 'segment'} onClick={() => setLang('JA')} aria-pressed={lang === 'JA'}>日本語</button>
        </div>
      </section>
      <section className="ranking-list" aria-label="Người chơi xếp hạng">
        <div className="ranking-header"><span>HẠNG / NGƯỜI CHƠI</span><span>TRẬN</span><span>ĐIỂM</span></div>
        {rows.map((row, index) => (
          <article className={`ranking-row${index < 3 ? ` ranking-top ranking-top-${index + 1}` : ''}`} key={`${row.name}-${index}`}>
            <span className="ranking-person"><b className="rank-number">{String(index + 1).padStart(2, '0')}</b><span className="rank-avatar">{row.name?.charAt(0)?.toUpperCase()}</span><strong>{row.name}</strong>{index === 0 && <span className="leader-tag">LEADER</span>}</span>
            <span className="ranking-games">{row.games}</span>
            <strong className="ranking-score">{row.total}<small> pts</small></strong>
          </article>
        ))}
        {rows.length === 0 && <p className="empty-state">Chưa có trận đấu nào trong chủ đề này. Hãy là người đầu tiên!</p>}
      </section>
    </div>
  );
}
