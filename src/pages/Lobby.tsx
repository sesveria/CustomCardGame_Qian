import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection } from '../store/connection';
import { useGameStore } from '../store/gameStore';
import type { FriendInfo } from '../engine/types';

const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const send = useConnection((s) => s.send);
  const on = useConnection((s) => s.on);
  const ws = useConnection((s) => s.ws);
  const connected = useConnection((s) => s.connected);
  const game = useGameStore((s) => s.game);
  const setGame = useGameStore((s) => s.setGame);

  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<{ userId: string; nickname: string }[]>([]);
  const [myNickname, setMyNickname] = useState('');
  const [myId, setMyId] = useState('');
  const [matchStatus, setMatchStatus] = useState<'idle' | 'waiting' | 'found'>('idle');
  const [inviteTarget, setInviteTarget] = useState('');
  const [pendingInvite, setPendingInvite] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState('');

  // Redirect to login if WebSocket is not connected
  useEffect(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      navigate('/', { replace: true });
    }
  }, [ws, connected, navigate]);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(on('auth_ok', (msg) => {
      if (msg.type === 'auth_ok') {
        setMyId(msg.userId);
        setMyNickname(msg.nickname);
      }
    }));

    unsubs.push(on('player_list', (msg) => {
      if (msg.type === 'player_list') setOnlinePlayers(msg.players);
    }));

    unsubs.push(on('friend_list', (msg) => {
      if (msg.type === 'friend_list') setFriends(msg.friends);
    }));

    unsubs.push(on('friend_added', (msg) => {
      if (msg.type === 'friend_added') {
        setFriends((prev) => {
          const exists = prev.find((f) => f.userId === msg.friend.userId);
          return exists ? prev : [...prev, msg.friend];
        });
      }
    }));

    unsubs.push(on('invite_received', (msg) => {
      if (msg.type === 'invite_received') {
        setPendingInvite({ id: msg.inviterId, name: msg.inviterName });
      }
    }));

    unsubs.push(on('invite_cancelled', () => setPendingInvite(null)));

    unsubs.push(on('match_found', (msg) => {
      if (msg.type === 'match_found') {
        setMatchStatus('found');
        send({ type: 'friend_add', target: msg.opponentName });
      }
    }));

    unsubs.push(on('match_waiting', () => setMatchStatus('waiting')));
    unsubs.push(on('match_timeout', () => setMatchStatus('idle')));

    unsubs.push(on('game_start', (msg) => {
      if (msg.type === 'game_start') {
        setGame(msg.state);
        navigate('/game');
      }
    }));

    unsubs.push(on('game_state', (msg) => {
      if (msg.type === 'game_state') {
        setGame(msg.state);
        navigate('/game');
      }
    }));

    unsubs.push(on('game_error', (msg) => {
      if (msg.type === 'game_error') setError(msg.message);
      setTimeout(() => setError(''), 3000);
    }));

    // Request friend list and player list on mount
    setTimeout(() => {
      send({ type: 'friend_list' });
    }, 300);

    return () => unsubs.forEach((u) => u());
  }, []);

  const handleMatch = () => { setMatchStatus('waiting'); send({ type: 'match_start' }); };
  const handleCancelMatch = () => { send({ type: 'match_cancel' }); setMatchStatus('idle'); };
  
  const handleVsBot = () => {
    send({ type: 'match_vs_bot' });
  };

  const handleInvite = () => {
    if (!inviteTarget.trim()) return;
    send({ type: 'invite_send', target: inviteTarget.trim() });
    setInviteTarget('');
  };
  const handleAccept = () => {
    if (pendingInvite) send({ type: 'invite_accept', inviterId: pendingInvite.id });
    setPendingInvite(null);
  };
  const handleDecline = () => {
    if (pendingInvite) send({ type: 'invite_decline', inviterId: pendingInvite.id });
    setPendingInvite(null);
  };

  const isBot = (p: { nickname: string }) => p.nickname === '🤖 机器人';

  return (
    <div className="page page-lobby">
      <div className="lobby-header">
        <div className="lobby-user">🧑 {myNickname} <span className="lobby-id">({myId})</span></div>
        <button className="btn btn-sm btn-secondary" onClick={() => navigate('/editor')}>✏️ 编辑器</button>
      </div>

      {error && <div className="lobby-error">{error}</div>}

      {pendingInvite && (
        <div className="lobby-invite-alert">
          <span>📨 {pendingInvite.name} 邀请你对战</span>
          <button className="btn btn-sm btn-primary" onClick={handleAccept}>接受</button>
          <button className="btn btn-sm btn-secondary" onClick={handleDecline}>拒绝</button>
        </div>
      )}

      <div className="lobby-grid">
        <div className="lobby-panel">
          <h3>👥 好友列表</h3>
          <div className="lobby-add-friend">
            <input
              value={inviteTarget}
              onChange={(e) => setInviteTarget(e.target.value)}
              placeholder="输入昵称加好友/邀请"
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <button className="btn btn-sm btn-primary" onClick={handleInvite}>+</button>
          </div>
          <div className="lobby-list">
            {friends.map((f) => (
              <div key={f.userId} className={`lobby-item ${f.online ? 'online' : 'offline'}`}>
                <span>{f.online ? '🟢' : '⚫'} {f.nickname} {isBot(f) ? '🤖' : ''}</span>
                {f.online && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => send({ type: 'invite_send', target: f.nickname })}
                  >
                    邀请
                  </button>
                )}
              </div>
            ))}
            {friends.length === 0 && <div className="lobby-empty">暂无好友</div>}
          </div>
        </div>

        <div className="lobby-panel">
          <h3>🌐 在线玩家</h3>
          <div className="lobby-list">
            {onlinePlayers.filter((p) => p.userId !== myId).map((p) => (
              <div key={p.userId} className="lobby-item online">
                <span>🟢 {p.nickname} {isBot(p) ? '🤖' : ''}</span>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => send({ type: 'invite_send', target: p.nickname })}
                >
                  邀请
                </button>
              </div>
            ))}
            {onlinePlayers.filter((p) => p.userId !== myId).length === 0 && (
              <div className="lobby-empty">暂无其他在线玩家</div>
            )}
          </div>
        </div>

        <div className="lobby-panel lobby-match-panel">
          <h3>⚔️ 对战</h3>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
            与机器人对战，或随机匹配在线玩家
          </p>
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
            <button className="btn btn-primary btn-large" onClick={handleVsBot}>
              🤖 对战机器人
            </button>
          </div>

          {matchStatus === 'idle' && (
            <button className="btn btn-secondary btn-large" onClick={handleMatch}>
              🎲 随机匹配
            </button>
          )}
          {matchStatus === 'waiting' && (
            <div>
              <div className="lobby-waiting">⏳ 正在寻找对手...</div>
              <button className="btn btn-sm btn-secondary" onClick={handleCancelMatch}>取消</button>
            </div>
          )}
          {matchStatus === 'found' && (
            <div className="lobby-found">✅ 对手已找到！</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
