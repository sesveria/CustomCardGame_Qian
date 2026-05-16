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
  const COIN_LABEL: Record<string, string> = { 'heads': '正面', 'tails': '反面' };
  const isDiscardingMode = !!game.isDiscarding;

  const mySettScore = (game.myScore ?? 0) - (game.myPairScore ?? 0);
  const oppSettScore = (game.opponentScore ?? 0) - (game.opponentPairScore ?? 0);
  const totalScore = Math.max(game.myScore + game.opponentScore, 1);
  const myPct = Math.round((game.myScore / totalScore) * 100);
  const oppPct = Math.round((game.opponentScore / totalScore) * 100);

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

      {/* Scoreboard with progress bars */}
      <div className="scoreboard">
        <div className="sb-player">
          <span className="sb-icon">🧑</span>
          <div>
            <span className="sb-name">你</span>
            <span className={`sb-score ${game.myScore > game.opponentScore ? 'winning' : game.myScore < game.opponentScore ? 'losing' : ''}`}>
              {game.myScore}
            </span>
          </div>
          <div className="sb-detail">
            配对{game.myPairScore ?? 0} · 结算{mySettScore}
          </div>
        </div>

        <div className="sb-progress">
          <div className="sb-progress-inner">
            <div className="sb-progress-bar my" style={{ width: `${myPct}%` }} />
            <div className="sb-progress-bar opp" style={{ width: `${oppPct}%` }} />
            <div className="sb-progress-spacer" />
          </div>
        </div>

        <div className="sb-player">
          <span className="sb-icon">🤖</span>
          <div>
            <span className="sb-name">对手</span>
            <span className={`sb-score ${game.opponentScore > game.myScore ? 'winning' : game.opponentScore < game.myScore ? 'losing' : ''}`}>
              {game.opponentScore}
            </span>
          </div>
          <div className="sb-detail">
            配对{game.opponentPairScore ?? 0} · 结算{oppSettScore}
          </div>
        </div>
      </div>

      {/* ─── Coin Toss ─── */}
      {displayPhase === 'coin_toss' && (
        <div className="popup-overlay">
          {!game.coinRevealed ? (
            /* ── Guess Phase ── */
            <div className="popup popup-coin">
              <div className="popup-title">🪙 抛硬币决定选牌权</div>
              <div className="popup-subtitle">猜对的一方优先选择卡组</div>

              <div className="coin-circle coin-idle" aria-label="硬币待猜">
                <span className="coin-char">?</span>
              </div>

              {game.coinGuessed ? (
                <p className="coin-guessed-msg">
                  你选了 <strong>{COIN_LABEL[game.coinMyGuess ?? 'heads']}</strong>，等待对手...
                </p>
              ) : (
                <div className="coin-guess-row">
                  <button
                    className="coin-guess-btn heads"
                    onClick={() => send({ type: 'game_coin_guess', guess: 'heads' })}
                  >
                    <span className="guess-icon">🟡</span>
                    <span className="guess-label">正面</span>
                  </button>
                  <button
                    className="coin-guess-btn tails"
                    onClick={() => send({ type: 'game_coin_guess', guess: 'tails' })}
                  >
                    <span className="guess-icon">⚪</span>
                    <span className="guess-label">反面</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Reveal Phase ── */
            <div className="popup popup-coin">
              <div className="coin-reveal">
                <div className="popup-title">🪙 硬币结果</div>

                <div className={`coin-circle coin-revealed ${game.coinResult === 'heads' ? 'coin-heads' : 'coin-tails'}`}>
                  <span className="coin-char">{game.coinResult === 'heads' ? '正' : '反'}</span>
                </div>

                <div className="coin-result-text">
                  {game.coinResult === 'heads' ? '🟡 正面' : '⚪ 反面'}
                </div>

                <span className={`coin-result-label ${game.coinGuessed ? 'won' : 'lost'}`}>
                  {game.coinGuessed ? '🎉 你猜对了！有优先选牌权' : '😞 你没猜对，对方先选卡组'}
                </span>
                <p className="coin-wait-text">即将进入选牌阶段...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Deck Select ─── */}
      {displayPhase === 'deck_select' && (
        <div className="popup-overlay">
          <div className="popup">
            <div className="popup-icon">📚</div>
            <div className="popup-title">选择卡组</div>
            {isMyTurn ? (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                {game.availableDeckIds.map((id) => (
                  <button
                    key={id}
                    className="deck-btn"
                    onClick={() => send({ type: 'game_select_deck', deckId: id })}
                  >
                    {id}
                  </button>
                ))}
              </div>
            ) : (
              <p className="deck-waiting">对手正在选择卡组...</p>
            )}
          </div>
        </div>
      )}

      {/* ─── Playing ─── */}
      {displayPhase !== 'coin_toss' && displayPhase !== 'deck_select' && displayPhase !== 'match_over' && (
        <div className="game-main" style={{ padding: '8px 16px' }}>
          {/* Settlement zones */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            <div className="settlement-zone my-zone" style={{ flex: 1 }}>
              <div className="hand-label">
                🧑 你的结算区 <span className="sett-score my">{mySettScore} 分</span>
              </div>
              <div className="sett-cards">
                {(game.mySettlement ?? []).map(c => (
                  <CardComponent key={c.id} card={c} size="small" />
                ))}
              </div>
            </div>
            <div className="settlement-zone opp-zone" style={{ flex: 1 }}>
              <div className="hand-label">
                🤖 对手结算区 <span className="sett-score opp">{oppSettScore} 分</span>
              </div>
              <div className="sett-cards">
                {(game.opponentSettlement ?? []).map(c => (
                  <CardComponent key={c.id} card={c} size="small" />
                ))}
              </div>
            </div>
          </div>

          {/* Discard indicator */}
          {isDiscardingMode && (
            <div className="discard-indicator">
              🔄 请从公共牌池选择一张牌换入手牌 (不可选回你刚放入的牌)
            </div>
          )}

          {/* Public Pool */}
          <div className="public-pool" style={{ marginBottom: 10 }}>
            <div className="hand-label">
              🃏 公共牌池
              <span className="hand-count">({game.publicPool.length} 张 · 牌堆 {game.drawPileCount})</span>
            </div>
            <div className="hand-cards">
              {game.publicPool.map((card) => {
                const canPick = game.phase === 'selecting-card' && isMyTurn;
                return (
                  <CardComponent
                    key={card.id}
                    card={card}
                    size="medium"
                    inPool
                    disabled={!canPick}
                    onClick={() => canPick && send({ type: 'game_pick_public', cardId: card.id })}
                  />
                );
              })}
            </div>
          </div>

          {/* Opponent hand */}
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

      {/* ─── Match Result Popup ─── */}
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

      {/* ─── Game Over ─── */}
      {(displayPhase === 'round_over' || displayPhase === 'match_over') && (
        <div className="popup-overlay">
          <div className={`popup popup-gameover ${game.myScore > game.opponentScore ? 'popup-success' : game.myScore < game.opponentScore ? 'popup-fail' : ''}`}>
            <div className="popup-icon">{game.myScore > game.opponentScore ? '🏆' : game.myScore < game.opponentScore ? '😞' : '🤝'}</div>
            <div className="popup-title">
              {game.myScore > game.opponentScore ? '恭喜你赢了！' : game.myScore < game.opponentScore ? '对手获胜' : '平局'}
            </div>
            <div className="gameover-scores">
              <div className="gs-row my">
                <span>🧑 你</span>
                <span>{game.myScore} 分 (配对 {game.myPairScore ?? 0} + 结算 {mySettScore}，{game.mySettlement?.length ?? 0} 张)</span>
              </div>
              <div className="gs-row opp">
                <span>🤖 对手</span>
                <span>{game.opponentScore} 分 (配对 {game.opponentPairScore ?? 0} + 结算 {oppSettScore}，{game.opponentSettlement?.length ?? 0} 张)</span>
              </div>
            </div>
            <div className="gameover-pairs">
              <h3>配对记录</h3>
              <div className="pairs-list">
                {game.matchedPairs.map((pair, i) => (
                  <div key={i} className={`pair-item pair-${pair.player}`}>
                    <span className="pair-player">[{pair.player === 'player1' ? '玩家1' : '玩家2'}]</span>
                    <span className="pair-cards">{pair.cardA} ↔ {pair.cardB}</span>
                    <span className="pair-type">[{pair.relationType}]</span>
                    <span className="pair-explanation">{pair.explanation}</span>
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
