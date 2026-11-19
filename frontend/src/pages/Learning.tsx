import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Learning() {
  const [topic, setTopic] = useState('travel');
  const [lessons, setLessons] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void api.get<{ lessons: Record<string, string[]> }>('/english-games/progress').then(({ data }) => { if (active) setLessons(data.lessons); }).catch(() => { if (active) setError('Chưa tải được tiến độ. Bạn vẫn có thể chọn bài học.'); });
    return () => { active = false; };
  }, []);
  return <section className="english-game-page"><p className="eyebrow">LỘ TRÌNH THEO CHỦ ĐỀ</p><h1>Học điều bạn cần.</h1><p className="page-intro">Mỗi bài 10 câu, tối đa 10 phút. Chơi lại nhận câu mới, không coi việc đảo đáp án là câu mới. Nếu còn dưới 10 câu chưa gặp, hãy đổi chủ đề/cấp độ. Đúng ít nhất 8/10 để đánh dấu đã đạt.</p>
    <div className="segmented-control" role="group" aria-label="Chủ đề">{[['travel', 'Du lịch'], ['work', 'Công việc'], ['life', 'Đời sống']].map(([id, name]) => <button className={topic === id ? 'segment is-active' : 'segment'} aria-pressed={topic === id} key={id} onClick={() => setTopic(id)}>{name}</button>)}</div>
    {error && <p role="status">{error}</p>}<div className="challenge-grid">{['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => <Link className="challenge-link" key={level} to={`/games/lesson?topic=${topic}&level=${level}`}><span>{lessons[topic]?.includes(level) ? '✓ ĐÃ ĐẠT' : '10 CÂU'}</span><strong>{level}</strong><small>Học từ vựng, nghe, chính tả và ghép nghĩa.</small></Link>)}</div><Link className="button button-quiet" to="/">Về sảnh</Link></section>;
}
