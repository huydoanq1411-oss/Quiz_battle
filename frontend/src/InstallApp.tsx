import { useEffect, useState } from 'react';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const standalone = () => window.matchMedia('(display-mode: standalone)').matches
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

export default function InstallApp() {
  const [installed, setInstalled] = useState(standalone);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [busy, setBusy] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const done = () => { setInstalled(true); setPrompt(null); };
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const changed = () => setInstalled(standalone());
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', done);
    displayMode.addEventListener('change', changed);
    return () => {
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', done);
      displayMode.removeEventListener('change', changed);
    };
  }, []);

  const install = async () => {
    if (!prompt) { setInstructions(value => !value); return; }
    setBusy(true);
    setMessage('');
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
    } catch {
      setInstructions(true);
      setMessage('Chưa mở được hộp cài đặt. Bạn có thể cài từ menu trình duyệt.');
    } finally {
      setPrompt(null);
      setBusy(false);
    }
  };

  if (installed) return null;

  return (
    <aside className="install-app" aria-label="Cài đặt Quiz Battle">
      <div className="install-app-row">
        <img src="/quiz-battle-icon.png" width="32" height="32" alt="" />
        <span><strong>Quiz Battle trên thiết bị của bạn</strong><small>Mở nhanh từ màn hình chính · Chơi cần Internet</small></span>
        <button className="button button-quiet button-small" type="button" disabled={busy} onClick={() => void install()} aria-expanded={instructions} aria-controls="install-help">
          {busy ? 'Đang mở…' : 'Cài ứng dụng'}
        </button>
      </div>
      <div id="install-help" hidden={!instructions} className="install-app-help">
        {message && <p role="status">{message}</p>}
        <p><strong>iPhone/iPad:</strong> mở bằng Safari → Chia sẻ → Thêm vào MH chính → Thêm.</p>
        <p><strong>Android hoặc máy tính:</strong> mở menu Chrome/Edge → Cài đặt Quiz Battle hoặc Thêm vào màn hình chính.</p>
        <p>Nếu chưa thấy mục cài đặt, mở link bằng trình duyệt thay vì trình duyệt bên trong ứng dụng khác.</p>
        <button className="button button-quiet button-small" type="button" onClick={() => setInstructions(false)}>Đóng hướng dẫn</button>
      </div>
    </aside>
  );
}
