import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection } from '../store/connection';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const connect = useConnection((s) => s.connect);
  const send = useConnection((s) => s.send);
  const on = useConnection((s) => s.on);
  const connected = useConnection((s) => s.connected);

  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleLogin = () => {
    if (!nickname.trim()) { setError('请输入昵称'); return; }

    setConnecting(true);
    setError('');

    const host = window.location.hostname || 'localhost';
    const port = window.location.port || '3000';
    const wsUrl = `ws://${host}:${port}/ws`;

    // Listen for auth response
    const unsub = on('auth_ok', (msg) => {
      if (msg.type === 'auth_ok') {
        unsub();
        navigate('/lobby');
      }
    });

    const unsubErr = on('auth_error', (msg) => {
      if (msg.type === 'auth_error') {
        unsubErr();
        setError(msg.reason);
        setConnecting(false);
      }
    });

    connect(wsUrl);

    // Wait briefly for connection, then send login
    setTimeout(() => {
      send({ type: 'auth_login', nickname: nickname.trim(), password: password || undefined });
    }, 500);
  };

  return (
    <div className="page page-login">
      <div className="login-box">
        <div className="home-logo">🃏</div>
        <h1 className="home-title">知识卡牌对战</h1>
        <p className="home-subtitle">请输入昵称加入游戏</p>

        <div className="login-form">
          <input
            className="login-input"
            placeholder="昵称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            autoFocus
          />
          <input
            className="login-input"
            placeholder="密码（可选）"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          {error && <div className="login-error">{error}</div>}
          <button
            className="btn btn-primary btn-large"
            onClick={handleLogin}
            disabled={connecting}
          >
            {connecting ? '连接中...' : '🚀 进入游戏'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
