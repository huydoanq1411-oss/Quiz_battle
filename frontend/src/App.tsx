import type { ReactElement } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store';
import { logout } from './store/authSlice';
import { closeSocket } from './socket';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import Room from './pages/Room';
import Leaderboard from './pages/Leaderboard';
import History from './pages/History';
import MatchDetail from './pages/MatchDetail';
import EnglishGame from './pages/EnglishGame';

function Private({ children }: { children: ReactElement }) {
  const token = useSelector((state: RootState) => state.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const nav = useNavigate();

  const out = () => { closeSocket(); dispatch(logout()); nav('/login'); };

  return (
    <div className="app-shell">
      {user && (
        <header className="topbar">
          <Link className="brand" to="/" aria-label="Quiz Battle trang chủ">
            <span className="brand-mark">Q</span>
            <span>QUIZ<span className="brand-light">/BATTLE</span></span>
          </Link>
          <nav className="main-nav" aria-label="Điều hướng chính">
            <Link to="/">Sảnh chơi</Link>
            <Link to="/leaderboard">Bảng xếp hạng</Link>
            <Link to="/history">Lịch sử</Link>
          </nav>
          <div className="account-nav">
            <span className="user-badge" aria-hidden="true">{user.name?.charAt(0)?.toUpperCase()}</span>
            <span className="user-name">{user.name}</span>
            <button className="button button-quiet button-small" onClick={out}>Đăng xuất</button>
          </div>
        </header>
      )}
      <main className={user ? 'app-main' : 'app-main app-main-auth'}>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/" element={<Private><Home /></Private>} />
          <Route path="/room/:code" element={<Private><Room /></Private>} />
          <Route path="/games/:kind" element={<Private><EnglishGame /></Private>} />
          <Route path="/leaderboard" element={<Private><Leaderboard /></Private>} />
          <Route path="/history" element={<Private><History /></Private>} />
          <Route path="/matches/:id" element={<Private><MatchDetail /></Private>} />
        </Routes>
      </main>
    </div>
  );
}
