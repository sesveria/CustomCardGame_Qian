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

  // Register game_state listener so this page receives state pushes from the server
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

  return (
    <div className="page page-game">
      {/* Score & Round Header */}
      <div className="scoreboard">
        <div className="sb-player">
          <span className="sb-icon">🧑</span>
          <span className="sb-name">你</span>
          <span className="sb-score">{game.myScore}</span>
          {game.roundNumber > 0 && (
            <span className="sb-round"> (第{game.roundNumber}局 {game.myRoundWins}胜)</span>
          )}
        </div>
        <div className="sb-vs">VS</div>
        <div className="sb-player">
          <span className="sb-icon">🤖</span>
          <span className="sb-name">对手</span>
          <span className="sb-score">{game.opponentScore}</span>
          {game.roundNumber > 0 && (
            <span className="sb-round"> ({game.opponentRoundWins}胜 第{game.roundNumber}局)</span>
          )}
        </div>
      </div>

      {/* Coin Toss */}
      {displayPhase === 'coin_toss' && (
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
                  🪙 反面
                </button>
              </div>
            )}
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
        <div className="game-main">
          {/* Public Pool + Opponent Hand */}
          <div className="game-board">
            <div className="opponent-area">
              <div className="hand-label">对手手牌 <span className="hand-count">({game.opponentHandCount} 张)</span></div>
              <div className="hand-cards">
                {Array.from({ length: game.opponentHandCount }).map((_, i) => (
                  <CardComponent key={i} card={{ id: 'back', name: '?' }} size="medium" inHand disabled />
                ))}
              </div>
            </div>

            <div className="public-pool">
              <div className="hand-label">公共牌池 <span className="hand-count">(余{game.drawPileCount}张)</span></div>
              <div className="hand-cards">
                {game.publicPool.map((card) => {
                  const canSelect = game.phase === 'selecting-card' && isMyTurn && game.selectedHandCard;
                  return (
                    <CardComponent
                      key={card.id}
                      card={card}
                      size="medium"
                      disabled={!canSelect}
                      onClick={() => canSelect && send({ type: 'game_pick_public', cardId: card.id })}
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
