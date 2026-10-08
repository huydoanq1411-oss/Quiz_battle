import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { isAxiosError } from 'axios';
import api from '../api';
import { login } from '../store/authSlice';

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const dispatch = useDispatch();
  const nav = useNavigate();

  const submit = async () => {
    try {
      const body = mode === 'login' ? { email, password } : { email, name, password };
      const { data } = await api.post(`/auth/${mode}`, body);
      dispatch(login(data));
      nav('/');
    } catch (error: unknown) {
      const message = isAxiosError<{ message?: string | string[] }>(error)
        ? error.response?.data?.message ?? (error.request ? 'Không kết nối được máy chủ. Hãy kiểm tra backend và thử lại.' : undefined)
        : undefined;
      setErr(Array.isArray(message) ? message.join(', ') : message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  return (
    <div className="auth-layout">
      <aside className="auth-art">
        <Link className="brand auth-brand" to="/">
          <span className="brand-mark">Q</span>
          <span>QUIZ<span className="brand-light">/BATTLE</span></span>
        </Link>
        <div className="auth-art-copy">
          <p className="eyebrow">THINK QUICK. LEARN ENGLISH.</p>
          <h1>Học nhanh.<br /><span>Nhớ lâu.</span></h1>
          <p>Luyện từ vựng, ngữ pháp và phản xạ qua những thử thách thi đấu ngắn.</p>
        </div>
        <div className="auth-art-footer"><span>CEFR A1 — C2</span><span>EST. 2026</span></div>
        <span className="auth-orbit orbit-one" aria-hidden="true">?</span>
        <span className="auth-orbit orbit-two" aria-hidden="true">!</span>
      </aside>
      <section className="auth-content">
        <div className="auth-form-wrap">
          <p className="eyebrow">{mode === 'login' ? 'CHÀO MỪNG TRỞ LẠI' : 'BẮT ĐẦU CUỘC CHƠI'}</p>
          <h2>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Tiếp tục nơi trận đấu đang chờ bạn.' : 'Tạo hồ sơ và thách đấu cùng bạn bè.'}</p>
          <form className="auth-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <label className="field-group" htmlFor="auth-email"><span className="field-label">EMAIL</span><input id="auth-email" type="email" placeholder="ban@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
            {mode === 'register' && <label className="field-group" htmlFor="auth-name"><span className="field-label">TÊN HIỂN THỊ</span><input id="auth-name" placeholder="Tên của bạn" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></label>}
            <label className="field-group" htmlFor="auth-password"><span className="field-label">MẬT KHẨU</span><input id="auth-password" type="password" placeholder="Ít nhất 6 ký tự" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
            {err && <p className="form-error" role="alert">{String(err)}</p>}
            <button className="button button-primary button-wide" type="submit">{mode === 'login' ? 'Vào sảnh chơi' : 'Tạo tài khoản'} <span aria-hidden="true">→</span></button>
          </form>
          <p className="auth-switch">
            {mode === 'login'
              ? <>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></>
              : <>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></>}
          </p>
        </div>
      </section>
    </div>
  );
}
