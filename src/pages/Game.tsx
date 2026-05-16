import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useConnection } from '../store/connection';
import { RELATION_LABELS } from '../engine/types';
import CardComponent from '../components/Card';
import type { GameStateForPlayer } from '../engine/types';

const Game: React.FC = () => {
  const navigate = useNavigate();
  const game = useGameStore((s) => s.game);
  const setGame = useGameStore((s) => s.setGame);
  const send = useConnection((s) => s.send);
  const on = useConnection((s) => s.on);

  useEffect(() => {
    const unsub = on('game_state', (msg) => {
      if (msg.type === 'game_state') {
        setGame(msg.state);
      }
    });
    return unsub;
  }, []);

  if (!game) {
    return (
      <div className="page page-game">
        <div className="game-empty">
          <p>未连接对局</p>
          <button className="btn btn-primary" onClick={() => navigate('/lobby')}>返回大厅</button>
        </div>
      </div>
    );
  }

  const displayPhase = game.phase;
  const isMyTurn = displayPhase === 'deck_select' ? (game.deckSelector === game.mySlot) : (game.currentPlayer === game.mySlot);
  const COIN_LABEL: Record<string, string> = { 'heads': '🪙 正面', 'tails': '🪙 反面' };
  const COIN_EMOJI: Record<string, string> = { 'heads': '🪙', 'tails': '📀' };
  const isDiscardingMode = !!game.isDiscarding;

  const mySettScore = (game.myScore ?? 0) - (game.myPairScore ?? 0);
  const oppSettScore = (game.opponentScore ?? 0) - (game.opponentPairScore ?? 0);

  const phaseLabel: Record<string, string> = {
    coin_toss: '抛硬币', deck_select: '选牌组', playing: '对战中',
    'selecting-card': '选牌中', matching: '判定中', round_over: '结束',
    match_over: '比赛结束',
  };

  return (
    <div className="page page-game">
      <div className="game-header">
        <div className="game-phase">{phaseLabel[displayPhase] || displayPhase}</div>
        <button className="btn btn-sm btn-secondary" onClick={() => navigate('/lobby')}>
          ← 大厅
        </button>
      </div>

      {/* Scoreboard */}
      <div className="scoreboard">
        <div className="sb-player">
          <span className="sb-icon">🧑</span>
          <span className="sb-name">你</span>
          <span className="sb-score">{game.myScore} 分</span>
          <span style={{fontSize:11,color:'#888',marginLeft:6}}>
            (配对 {game.myPairScore ?? 0} + 结算 {mySettScore})
          </span>
        </div>
        <div className="sb-vs">VS</div>
        <div className="sb-player">
          <span className="sb-icon">🤖</span>
          <span className="sb-name">对手</span>
          <span className="sb-score">{game.opponentScore} 分</span>
          <span style={{fontSize:11,color:'#888',marginLeft:6}}>
            (配对 {game.opponentPairScore ?? 0} + 结算 {oppSettScore})
          </span>
        </div>
      </div>

      {/* Coin Toss */}
      {displayPhase === 'coin_toss' && !game.coinRevealed && (
        <div className="popup-overlay">
          <div className="popup popup-coin">
            <div className="popup-icon">🪙</div>
            <div className="popup-title">抛硬币决定选牌权</div>
            <p style={{ color: '#ccc', fontSize: 13 }}>猜对的一方优先选择卡组</p>
            {game.coinGuessed ? (
              <p>你已选择: {COIN_LABEL[game.coinMyGuess ?? 'heads']}，等待对手...</p>
            ) : (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => send({ type: 'game_coin_guess', guess: 'heads' })}>
                  🪙 正面
                </button>
                <button className="btn btn-primary" onClick={() => send({ type: 'game_coin_guess', guess: 'tails' })}>
                  📀 反面
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coin Result Reveal */}
      {displayPhase === 'coin_toss' && game.coinRevealed && (
        <div className="popup-overlay">
          <div className="popup popup-coin">
            <div className="popup-icon" style={{ fontSize: 64 }}>{COIN_EMOJI[game.coinResult ?? 'heads']}</div>
            <div className="popup-title">结果: {COIN_LABEL[game.coinResult ?? 'heads']}</div>
            <p style={{ color: '#4af', fontSize: 14 }}>
              {game.coinGuessed ? '你猜对了！你有优先选牌权' : '你没猜对，对方先选卡组'}
            </p>
            <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>即将进入选牌阶段...</p>
          </div>
        </div>
      )}

      {/* Deck Select */}
      {displayPhase === 'deck_select' && (
        <div className="popup-overlay">
          <div className="popup popup-deck">
            <div className="popup-icon">📚</div>
            <div className="popup-title">选择卡组</div>
            {isMyTurn ? (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                {game.availableDeckIds.map((id) => (
                  <button
                    key={id}
                    className="btn btn-primary"
                    onClick={() => send({ type: 'game_select_deck', deckId: id })}
                  >
                    {id}
                  </button>
                ))}
              </div>
            ) : (
              <p>对手正在选择卡组...</p>
            )}
          </div>
        </div>
      )}

      {/* Playing */}
      {displayPhase !== 'coin_toss' && displayPhase !== 'deck_select' && displayPhase !== 'match_over' && (
        <div className="game-main" style={{ padding: '8px 16px' }}>
          {/* Settlement zones */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <div className="settlement-zone" style={{ flex: 1, background: '#1a2a3a', borderRadius: 8, padding: 6, minHeight: 60 }}>
              <div className="hand-label">🧑 你的结算区 <span style={{color:'#4af'}}>得分:{mySettScore}</span></div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(game.mySettlement ?? []).map(c => (
                  <CardComponent key={c.id} card={c} size="small" />
                ))}
              </div>
            </div>
            <div className="settlement-zone" style={{ flex: 1, background: '#2a1a1a', borderRadius: 8, padding: 6, minHeight: 60 }}>
              <div className="hand-label">🤖 对手结算区 <span style={{color:'#f44'}}>得分:{oppSettScore}</span></div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(game.opponentSettlement ?? []).map(c => (
                  <CardComponent key={c.id} card={c} size="small" />
                ))}
              </div>
            </div>
          </div>

          {/* Discard-pick indicator */}
          {isDiscardingMode && (
            <div style={{ background: '#4a3020', borderRadius: 8, padding: '8px 16px', marginBottom: 8, textAlign: 'center' }}>
              🔄 请从公共牌池选择一张牌换入手牌 (不可选回你刚放入的牌)
            </div>
          )}

          {/* Public Pool */}
          <div className="public-pool" style={{ marginBottom: 8 }}>
            <div className="hand-label">
              🃏 公共牌池
              <span className="hand-count">({game.publicPool.length} 张 | 牌堆剩余 {game.drawPileCount})</span>
            </div>
            <div className="hand-cards">
              {game.publicPool.map((card) => {
                const canPick = game.phase === 'selecting-card' && isMyTurn;
                return (
                  <CardComponent
                    key={card.id}
                    card={card}
                    size="medium"
                    disabled={!canPick}
                    onClick={() => canPick && send({ type: 'game_pick_public', cardId: card.id })}
                  />
                );
              })}
            </div>
          </div>

          {/* Opponent hand count */}
          <div className="hand-label" style={{ marginBottom: 4 }}>
            🤖 对手手牌 <span className="hand-count">({game.opponentHandCount} 张)</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            {game.phase === 'selecting-card' && isMyTurn && !isDiscardingMode && game.selectedHandCard && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => send({ type: 'game_discard_hand' })}
                style={{ marginLeft: 'auto' }}
              >
                🗑 弃入公池换牌
              </button>
            )}
            <button
              className="btn btn-sm btn-danger"
              onClick={() => send({ type: 'game_concede' })}
              style={{ marginLeft: isDiscardingMode ? 'auto' : 0 }}
            >
              认输
            </button>
          </div>

          {/* My hand */}
          <div className="hand">
            <div className="hand-label">我的手牌 <span className="hand-count">({game.myHand.length} 张)</span></div>
            <div className="hand-cards">
              {game.myHand.map((card) => {
                const canSelect = game.phase === 'selecting-card' && isMyTurn && !isDiscardingMode;
                const isSelected = game.selectedHandCard?.id === card.id;
                return (
                  <CardComponent
                    key={card.id}
                    card={card}
                    size="medium"
                    inHand
                    selected={isSelected}
                    disabled={!canSelect}
                    onClick={() => canSelect && send({ type: 'game_pick_hand', cardId: card.id })}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Match Result Popup */}
      {game.lastMatchResult && (
        <div className="popup-overlay">
          <div className={`popup ${game.lastMatchResult.success ? 'popup-success' : 'popup-fail'}`}>
            <div className="popup-icon">{game.lastMatchResult.success ? '✨' : '💨'}</div>
            <div className="popup-title">
              {game.lastMatchResult.success ? '配对成功！' : '未匹配'}
            </div>
            {game.lastMatchResult.success && game.lastMatchResult.relation && (
              <>
                <div className="popup-type">[{RELATION_LABELS[game.lastMatchResult.relation.type] || game.lastMatchResult.relation.type}]</div>
                <div className="popup-explanation">{game.lastMatchResult.explanation}</div>
                <div className="popup-score">+{game.lastMatchResult.score} 分</div>
              </>
            )}
            {!game.lastMatchResult.success && (
              <div className="popup-fail-msg">{game.lastMatchResult.explanation || '手牌退回，回合结束'}</div>
            )}
            <button className="popup-btn" onClick={() => send({ type: 'game_dismiss_popup' })}>
              确定
            </button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {(displayPhase === 'round_over' || displayPhase === 'match_over') && (
        <div className="popup-overlay">
          <div className={`popup popup-gameover ${game.myScore > game.opponentScore ? 'popup-success' : game.myScore < game.opponentScore ? 'popup-fail' : ''}`}>
            <div className="popup-icon">{game.myScore > game.opponentScore ? '🏆' : game.myScore < game.opponentScore ? '😞' : '🤝'}</div>
            <div className="popup-title">
              {game.myScore > game.opponentScore ? '恭喜你赢了！' : game.myScore < game.opponentScore ? '对手获胜' : '平局'}
            </div>
            <div className="gameover-scores">
              <div>你: {game.myScore} 分 (配对 {game.myPairScore ?? 0} + 结算 {mySettScore}，结算区 {game.mySettlement?.length ?? 0} 张)</div>
              <div>对手: {game.opponentScore} 分 (配对 {game.opponentPairScore ?? 0} + 结算 {oppSettScore}，结算区 {game.opponentSettlement?.length ?? 0} 张)</div>
            </div>
            <div className="gameover-pairs">
              <h3>配对记录</h3>
              <div className="pairs-list">
                {game.matchedPairs.map((pair, i) => (
                  <div key={i} className={`pair-item pair-${pair.player}`}>
                    <span className="pair-player">[{pair.player === 'player1' ? '玩家1' : '玩家2'}]</span>
                    <span className="pair-cards"> {pair.cardA} ↔ {pair.cardB}</span>
                    <span className="pair-type"> [{pair.relationType}]</span>
                    <span className="pair-explanation"> {pair.explanation}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="popup-btn" onClick={() => navigate('/lobby')}>返回大厅</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
