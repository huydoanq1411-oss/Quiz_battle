import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../socket';

type EnglishLevel = 'A1-A2' | 'B1-B2' | 'C1-C2';
type JapaneseLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
type QuizLevel = EnglishLevel | JapaneseLevel;

interface RoomResponse { code: string; error?: string }

const ENGLISH_LEVELS: { value: EnglishLevel; label: string; detail: string }[] = [
  { value: 'A1-A2', label: 'Cơ bản', detail: 'A1–A2' },
  { value: 'B1-B2', label: 'Trung cấp', detail: 'B1–B2' },
  { value: 'C1-C2', label: 'Nâng cao', detail: 'C1–C2' },
];
const JAPANESE_LEVELS: { value: JapaneseLevel; detail: string }[] = [
  { value: 'N5', detail: 'Sơ cấp' }, { value: 'N4', detail: 'Cơ bản' },
  { value: 'N3', detail: 'Trung cấp' }, { value: 'N2', detail: 'Khá' },
  { value: 'N1', detail: 'Cao cấp' },
];

export default function Home() {
  const nav = useNavigate();
  const [lang, setLang] = useState<'EN' | 'JA'>('EN');
  const [mode, setMode] = useState<'VOCAB' | 'IELTS'>('VOCAB');
  const [level, setLevel] = useState<QuizLevel>('A1-A2');
  const [total, setTotal] = useState(5);
  const [code, setCode] = useState('');

  const create = () =>
    getSocket().emit('room:create', { lang, total, mode: lang === 'JA' ? 'JLPT' : mode, level }, (res: RoomResponse) => nav(`/room/${res.code}`));

  const join = () =>
    getSocket().emit('room:join', { code }, (res: RoomResponse) =>
      res.error ? alert(res.error) : nav(`/room/${res.code}`));

  return (
    <div className="page page-home">
      <section className="welcome-row">
        <div>
          <p className="eyebrow"><span className="live-dot" /> PHÒNG CHƠI TRỰC TUYẾN</p>
          <h1>Đến lượt <span>bạn.</span></h1>
          <p className="page-intro">Tạo một trận đấu mới hoặc nhập mã phòng để tham gia cùng bạn bè.</p>
        </div>
        <div className="welcome-stamp" aria-hidden="true"><span>THINK</span><b>FAST!</b><i>★</i></div>
      </section>

      <section className="home-grid" aria-label="Bắt đầu trận đấu">
        <article className="play-panel create-panel">
          <div className="panel-heading">
            <span className="panel-index">01 / NEW MATCH</span>
            <span className="panel-symbol" aria-hidden="true">↗</span>
          </div>
          <h2>Tạo phòng</h2>
          <p className="panel-copy">Chọn chủ đề, gọi hội bạn và bắt đầu cuộc đua kiến thức.</p>
          <div className="field-group">
            <span className="field-label">CHỦ ĐỀ</span>
            <div className="segmented-control" role="group" aria-label="Chọn ngôn ngữ câu hỏi">
              <button className={lang === 'EN' ? 'segment is-active' : 'segment'} onClick={() => { setLang('EN'); setLevel('A1-A2'); }} aria-pressed={lang === 'EN'}>English <span>EN</span></button>
              <button className={lang === 'JA' ? 'segment is-active' : 'segment'} onClick={() => { setLang('JA'); setLevel('N5'); }} aria-pressed={lang === 'JA'}>日本語 <span>JA</span></button>
            </div>
          </div>
          {lang === 'EN' ? (
            <>
              <div className="field-group">
                <span className="field-label">DẠNG BÀI</span>
                <div className="segmented-control" role="group" aria-label="Chọn dạng câu hỏi tiếng Anh">
                  <button className={mode === 'VOCAB' ? 'segment is-active' : 'segment'} onClick={() => setMode('VOCAB')} aria-pressed={mode === 'VOCAB'}>Từ vựng</button>
                  <button className={mode === 'IELTS' ? 'segment is-active' : 'segment'} onClick={() => setMode('IELTS')} aria-pressed={mode === 'IELTS'}>IELTS · câu</button>
                </div>
              </div>
              <div className="field-group">
                <span className="field-label">CẤP ĐỘ {mode === 'IELTS' ? '· IELTS BAND' : '· CEFR'}</span>
                <div className="segmented-control level-control" role="group" aria-label="Chọn cấp độ tiếng Anh">
                  {ENGLISH_LEVELS.map((item, index) => (
                    <button className={level === item.value ? 'segment is-active' : 'segment'} onClick={() => setLevel(item.value)} aria-pressed={level === item.value} key={item.value}>
                      {mode === 'IELTS' ? ['4–5', '6–7', '8–9'][index] : item.detail}
                      <small>{item.label}</small>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="field-group">
              <span className="field-label">CẤP ĐỘ JLPT</span>
              <div className="segmented-control level-control jlpt-control" role="group" aria-label="Chọn cấp độ JLPT">
                {JAPANESE_LEVELS.map((item) => (
                  <button className={level === item.value ? 'segment is-active' : 'segment'} onClick={() => setLevel(item.value)} aria-pressed={level === item.value} key={item.value}>
                    {item.value}<small>{item.detail}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="field-group" htmlFor="question-count">
            <span className="field-label">SỐ CÂU HỎI</span>
            <span className="input-wrap number-wrap">
              <input id="question-count" type="number" min={3} max={20} value={total} onChange={(e) => setTotal(Math.min(20, Math.max(3, Number(e.target.value))))} />
              <span>03 — 20 câu</span>
            </span>
          </label>
          <button className="button button-primary button-wide" onClick={create}>Tạo phòng mới <span aria-hidden="true">→</span></button>
        </article>

        <article className="play-panel join-panel">
          <div className="panel-heading">
            <span className="panel-index">02 / JOIN MATCH</span>
            <span className="panel-symbol" aria-hidden="true">⌁</span>
          </div>
          <h2>Vào phòng</h2>
          <p className="panel-copy">Đã có mã mời? Nhập mã bên dưới để nhập cuộc ngay.</p>
          <form className="join-form" onSubmit={(event) => { event.preventDefault(); join(); }}>
            <label className="field-group" htmlFor="room-code">
              <span className="field-label">MÃ PHÒNG</span>
              <input id="room-code" className="code-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VD: K7P2QX" maxLength={12} autoComplete="off" />
            </label>
            <button className="button button-ink button-wide" type="submit" disabled={!code.trim()}>Tham gia trận <span aria-hidden="true">→</span></button>
          </form>
          <div className="join-footnote"><span className="live-dot" /> Trận đấu nhiều người · Cập nhật trực tiếp</div>
        </article>
      </section>
      <footer className="page-foot"><span>KIẾN THỨC LÀ MÔN THỂ THAO ĐỒNG ĐỘI.</span><span>QB — 2026</span></footer>
    </div>
  );
}
