import { useState } from 'react';
import { checkPracticeAnswer, type ReviewItem } from './review';

export default function WrongAnswerReview({ items }: { items: ReviewItem[] | null | undefined }) {
  const [mode, setMode] = useState<'summary' | 'practice' | 'done'>('summary');
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [missed, setMissed] = useState<ReviewItem[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState<boolean | null>(null);

  if (!items) return <section className="mistake-review"><h2>Ôn câu sai</h2><p>Lượt chơi này chưa có dữ liệu ôn tập. Hãy hoàn thành một lượt mới để lưu các câu cần ôn.</p></section>;
  if (!items.length) return <section className="mistake-review"><p className="eyebrow">ÔN CÂU SAI</p><h2>Không có câu sai cần ôn.</h2><p>Bạn có thể bắt đầu lượt mới để tiếp tục luyện tập.</p></section>;

  const begin = (questions: ReviewItem[]) => {
    setQueue(questions);
    setMissed([]);
    setIndex(0);
    setAnswer('');
    setChecked(null);
    setMode('practice');
  };

  if (mode === 'done') return (
    <section className="mistake-review" aria-label="Kết quả ôn tập">
      <p className="eyebrow">ĐÃ LUYỆN XONG</p>
      <h2>Đúng {queue.length - missed.length} / {queue.length} câu.</h2>
      <p>{missed.length ? `Còn ${missed.length} câu cần luyện thêm. Đọc lại giải thích rồi thử một lần nữa nhé.` : 'Bạn đã trả lời đúng toàn bộ câu trong lần ôn này.'}</p>
      <div className="review-actions">
        {missed.length > 0 && <button className="button button-primary" type="button" onClick={() => begin(missed)}>Luyện tiếp {missed.length} câu còn sai</button>}
        <button className="button button-quiet" type="button" onClick={() => setMode('summary')}>Xem lại đáp án</button>
      </div>
    </section>
  );

  if (mode === 'practice') {
    const item = queue[index];
    const submit = (event: React.FormEvent) => {
      event.preventDefault();
      if (checked !== null || !answer.trim()) return;
      const correct = checkPracticeAnswer(answer, item.correctAnswer);
      setChecked(correct);
      if (!correct) setMissed(previous => [...previous, item]);
    };
    const next = () => {
      if (index + 1 >= queue.length) setMode('done');
      else { setIndex(previous => previous + 1); setAnswer(''); setChecked(null); }
    };
    return (
      <section className="mistake-review" aria-label="Luyện lại câu sai">
        <div className="review-heading"><div><p className="eyebrow">LUYỆN LẠI · KHÔNG TÍNH ĐIỂM</p><h2>Câu {index + 1} / {queue.length}</h2></div><button className="button button-quiet button-small" type="button" onClick={() => setMode('summary')}>Về danh sách</button></div>
        <p className="review-prompt">{item.prompt}</p>
        {item.spokenText && <p>Từ đã nghe: <strong lang="en">{item.spokenText}</strong></p>}
        {item.letters && <p className="review-letters">{item.letters.join(' · ')}</p>}
        <form onSubmit={submit}>
          {item.options ? <div className="english-options">{item.options.map((option, optionIndex) => <button className={`english-option${answer === option ? ' is-selected' : ''}`} key={`${option}-${optionIndex}`} type="button" disabled={checked !== null} onClick={() => setAnswer(option)}><b>{optionIndex + 1}</b><span>{option}</span></button>)}</div> : <label className="english-answer-input"><span>{item.answerLength ? `Nhập từ (${item.answerLength} chữ cái)` : 'Câu trả lời'}</span><input value={answer} onChange={event => setAnswer(event.target.value)} disabled={checked !== null} autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={200} /></label>}
          {checked === null && <button className="button button-primary" type="submit" disabled={!answer.trim()}>Kiểm tra đáp án</button>}
        </form>
        {checked !== null && <div className="review-feedback" role="status"><h3>{checked ? 'Chính xác!' : 'Chưa đúng, cùng ghi nhớ lại.'}</h3><p>Đáp án đúng: <strong>{item.correctAnswer}</strong></p><p>{item.explanation}</p><button className="button button-primary" type="button" onClick={next}>{index + 1 === queue.length ? 'Xem kết quả ôn tập' : 'Câu tiếp theo'}</button></div>}
      </section>
    );
  }

  return (
    <section className="mistake-review" aria-label="Ôn câu sai">
      <div className="review-heading"><div><p className="eyebrow">BIẾN LỖI SAI THÀNH TIẾN BỘ</p><h2>{items.length} câu cần ôn.</h2><p>Luyện lại không giới hạn thời gian và không thay đổi điểm xếp hạng.</p></div><button className="button button-primary" type="button" onClick={() => begin(items)}>Luyện lại {items.length} câu</button></div>
      <ol className="review-list">
        {items.map(item => <li key={item.id}><details><summary><span>Câu {item.number} · {item.skill}{item.reason === 'unanswered' ? ' · Chưa trả lời' : ''}</span><strong>{item.prompt}</strong></summary><div className="review-explanation"><p>Bạn đã trả lời: <span>{item.submittedAnswers.length ? item.submittedAnswers.join(' → ') : 'Chưa trả lời'}</span></p><p>Đáp án đúng: <strong>{item.correctAnswer}</strong></p><p>{item.explanation}</p></div></details></li>)}
      </ol>
    </section>
  );
}
