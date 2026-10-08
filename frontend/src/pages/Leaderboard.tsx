import { useEffect, useState } from 'react';
import api from '../api';

type LeaderboardScope = 'today' | 'week' | 'all';
interface LeaderboardRow { userId: number; name: string; score: number }

export default function Leaderboard() {
  const [scope, setScope] = useState<LeaderboardScope>('today');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    api.get('/english-games/leaderboard', { params: { scope } }).then((response) => setRows(response.data));
  }, [scope]);

  return (
    <div className="page">
      <section className="list-page-heading">
        <div><p className="eyebrow">CỘNG ĐỒNG / THI ĐẤU TOÀN CẦU</p><h1>Bảng xếp hạng<span>.</span></h1><p className="page-intro">Điểm số được tổng hợp từ các thử thách tiếng Anh.</p></div>
        <div className="segmented-control leaderboard-tabs" role="group" aria-label="Chọn khoảng thời gian bảng xếp hạng">
          {([{ value: 'today', label: 'Hôm nay' }, { value: 'week', label: 'Tuần này' }, { value: 'all', label: 'Mọi lúc' }] as const).map((tab) => <button className={scope === tab.value ? 'segment is-active' : 'segment'} onClick={() => setScope(tab.value)} aria-pressed={scope === tab.value} key={tab.value}>{tab.label}</button>)}
        </div>
      </section>
      <section className="ranking-list" aria-label="Người chơi xếp hạng">
        <div className="ranking-header"><span>HẠNG / NGƯỜI CHƠI</span><span></span><span>ĐIỂM</span></div>
        {rows.map((row, index) => (
          <article className={`ranking-row${index < 3 ? ` ranking-top ranking-top-${index + 1}` : ''}`} key={row.userId}>
            <span className="ranking-person"><b className="rank-number">{String(index + 1).padStart(2, '0')}</b><span className="rank-avatar">{row.name?.charAt(0)?.toUpperCase()}</span><strong>{row.name}</strong>{index === 0 && <span className="leader-tag">LEADER</span>}</span>
            <span />
            <strong className="ranking-score">{row.score}<small> pts</small></strong>
          </article>
        ))}
        {rows.length === 0 && <p className="empty-state">Chưa có điểm trên bảng xếp hạng này. Hãy bắt đầu thử thách đầu tiên!</p>}
      </section>
    </div>
  );
}
