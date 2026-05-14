import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useConnection } from '../store/connection';
import { RELATION_LABELS } from '../engine/types';
import CardComponent from '../components/Card';
import type { GameStateForPlayer } from '../engine/types';

const Game: React.FC = () => {
  const navigate = useNavigate();
  const game = useGameStore((s) => s.game);
  const send = useConnection((s) => s.send);

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

  return (
    <div className="page page-game">
      {/* Score & Round Header */}
      <div className="scoreboard">
        <div className="sb-player">
          <span className="sb-icon">🧑</span>
          <span className="sb-name">你</span>
          <span className="sb-score">{game.myScore}</span>
          {game.roundNumber > 0 && (
            <span className="sb-round-wins">🏆×{game.myRoundWins}</span>
          )}
        </div>
        <div className="sb-center">
          <div className="sb-turn">
            {game.currentPlayer && (
              <span className="sb-turn-label">
                {game.currentPlayer === game.mySlot ? '你的回合' : '对手的回合'}
              </span>
            )}
          </div>
          <div className="sb-pile">牌堆: {game.drawPileCount}</div>
          {game.roundNumber > 0 && (
            <div className="sb-round">Round {game.roundNumber}/3</div>
          )}
        </div>
        <div className="sb-player">
          <span className="sb-icon">👤</span>
          <span className="sb-name">对手</span>
          <span className="sb-score">{game.opponentScore}</span>
          {game.roundNumber > 0 && (
            <span className="sb-round-wins">🏆×{game.opponentRoundWins}</span>
          )}
        </div>
      </div>

      {/* Coin Toss — first picker locks, opponent auto-assigned opposite */}
      {displayPhase === 'coin_toss' && (
        <div className="popup-overlay">
          <div className="popup">
            <div className="popup-icon">🪙</div>
            <div className="popup-title">抛硬币</div>
            <p style={{ marginBottom: 16, color: '#aaa', fontSize: 14 }}>
              先选择的人锁定硬币面，对手自动获得另一面
            </p>

            {!game.coinGuessed || !game.coinMyGuess ? (
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <button className="btn btn-primary btn-large" onClick={() => send({ type: 'game_coin_guess', guess: 'heads' })}>
                  🪙 正面
                </button>
                <button className="btn btn-secondary btn-large" onClick={() => send({ type: 'game_coin_guess', guess: 'tails' })}>
                  🪙 反面
                </button>
              </div>
            ) : (
              <div style={{ color: '#888', fontSize: 16 }}>
                你：{COIN_LABEL[game.coinMyGuess] ?? game.coinMyGuess}<br/>
                对手：{COIN_LABEL[game.coinMyGuess === 'heads' ? 'tails' : 'heads'] ?? (game.coinMyGuess === 'heads' ? 'tails' : 'heads')}
              </div>
            )}

            {game.coinResult && (
              <div style={{ marginTop: 16, padding: 12, background: '#1a2a1a', borderRadius: 8 }}>
                结果：{game.coinResult === 'heads' ? '正面' : '反面'}！
                {game.deckSelector === game.mySlot ? ' → 你先选卡组' : ' → 对手先选卡组'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deck Select */}
      {displayPhase === 'deck_select' && (
        <div className="popup-overlay">
          <div className="popup">
            <div className="popup-icon">📚</div>
            <div className="popup-title">
              {game.deckSelector === game.mySlot ? '请选择卡组' : '对手正在选择卡组...'}
            </div>
            {game.deckSelector === game.mySlot && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {game.availableDeckIds.map((did) => (
                  <button key={did} className="btn btn-primary" onClick={() => send({ type: 'game_select_deck', deckId: did })}>
                    {did}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Playing */}
      {(displayPhase === 'playing' || displayPhase === 'selecting-card' || displayPhase === 'matching') && (
        <div className="game-area">
          {/* Opponent hand (hidden) */}
          <div className="game-ai-hand">
            <div className="hand">
              <div className="hand-label">对手手牌 <span className="hand-count">({game.opponentHandCount} 张)</span></div>
              <div className="hand-cards">
                {Array.from({ length: game.opponentHandCount }).map((_, i) => (
                  <div key={i} className="card card-small card-disabled card-in-hand">
                    <div className="card-inner"><div className="card-name">?</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Public Pool */}
          <div className="board">
            <div className="board-header">
              <span className="board-title">公共牌池</span>
              <span className="board-count">{game.publicPool.length} 张</span>
            </div>
            <div className="board-cards">
              {game.publicPool.map((card) => {
                const canClick = game.phase === 'selecting-card' && isMyTurn;
                const lastPair = game.matchedPairs[game.matchedPairs.length - 1];
                const matched = !!(game.lastMatchResult?.success && lastPair && (lastPair.cardA === card.name || lastPair.cardB === card.name));
                return (
                  <CardComponent
                    key={card.id}
                    card={card}
                    size="small"
                    inPool
                    disabled={!canClick}
                    matched={matched}
                    onClick={() => canClick && send({ type: 'game_pick_public', cardId: card.id })}
                  />
                );
              })}
            </div>
          </div>

          {/* Info bar */}
          <div className="game-info-bar">
            <span className="info-deck">📚 {game.myDeckId ?? '对战'}</span>
            <button className="btn btn-sm btn-danger" onClick={() => send({ type: 'game_concede' })}>
              认输
            </button>
          </div>

          {/* My hand */}
          <div className="hand">
            <div className="hand-label">我的手牌 <span className="hand-count">({game.myHand.length} 张)</span></div>
            <div className="hand-cards">
              {game.myHand.map((card) => {
                const canSelect = game.phase === 'selecting-card' && isMyTurn;
                return (
                  <CardComponent
                    key={card.id}
                    card={card}
                    size="medium"
                    inHand
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
              {game.lastMatchResult.success ? '配对成功！' : '没有关联'}
            </div>
            {game.lastMatchResult.success && game.lastMatchResult.relation && (
              <>
                <div className="popup-type">[{RELATION_LABELS[game.lastMatchResult.relation.type] || game.lastMatchResult.relation.type}]</div>
                <div className="popup-explanation">{game.lastMatchResult.explanation}</div>
                <div className="popup-score">+{game.lastMatchResult.score} 分</div>
              </>
            )}
            {!game.lastMatchResult.success && (
              <div className="popup-fail-msg">手牌退回，回合结束</div>
            )}
            <button className="popup-btn" onClick={() => send({ type: 'game_dismiss_popup' })}>
              确定
            </button>
          </div>
        </div>
      )}

      {/* Round Over */}
      {displayPhase === 'round_over' && (
        <div className="popup-overlay">
          <div className="popup popup-success">
            <div className="popup-icon">🏁</div>
            <div className="popup-title">
              {game.myScore > game.opponentScore ? '你赢了本局！' : game.myScore < game.opponentScore ? '对手赢了本局' : '本局平局'}
            </div>
            <div className="gameover-scores">
              <div>你: {game.myScore} 分</div>
              <div>对手: {game.opponentScore} 分</div>
            </div>
            <p style={{ color: '#888', fontSize: 13 }}>等待下一局...</p>
          </div>
        </div>
      )}

      {/* Match Over */}
      {displayPhase === 'match_over' && (
        <div className="popup-overlay">
          <div className={`popup popup-gameover ${game.myRoundWins > game.opponentRoundWins ? 'popup-success' : 'popup-fail'}`}>
            <div className="popup-icon">{game.myRoundWins > game.opponentRoundWins ? '🏆' : '😞'}</div>
            <div className="popup-title">
              {game.myRoundWins > game.opponentRoundWins ? '恭喜你赢了！' : '对手获胜'}
            </div>
            <div className="gameover-scores">
              <div>你: {game.myRoundWins} 胜</div>
              <div>对手: {game.opponentRoundWins} 胜</div>
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
