import type { GameStateForPlayer, Card, PlayerSlot, ClientMessage } from '../shared/protocol.js';

/**
 * Pure AI logic — no WebSocket, no fake session.
 * Driven by GameRoom which calls handleState(pushState) on each server push.
 */
export class BotAI {
  private game: GameStateForPlayer | null = null;
  private onAction: ((msg: ClientMessage) => void) | null = null;
  private timer: NodeJS.Timeout | null = null;

  bind(onAction: (msg: ClientMessage) => void): void {
    this.onAction = onAction;
  }

  handleState(state: GameStateForPlayer): void {
    this.game = state;
    if (this.timer) clearTimeout(this.timer);

    const delay = 600 + Math.random() * 1000; // 0.6–1.6s
    this.timer = setTimeout(() => this.act(), delay);
  }

  private act(): void {
    const g = this.game;
    const s = this.onAction;
    if (!g || !s) return;

    switch (g.phase) {
      case 'coin_toss':
        if (!g.coinGuessed) {
          const guess: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
          s({ type: 'game_coin_guess', guess });
        }
        break;

      case 'deck_select':
        if (g.deckSelector === g.mySlot) {
          const idx = Math.floor(Math.random() * g.availableDeckIds.length);
          s({ type: 'game_select_deck', deckId: g.availableDeckIds[idx] });
        }
        break;

      case 'selecting-card': {
        const isMe = g.currentPlayer === g.mySlot;
        if (!isMe) break;

        if (g.isDiscarding) {
          // Post-discard: pick a card from pool (can't be the discarded one)
          if (g.publicPool.length > 0) {
            // Pick random pool card
            const pc = g.publicPool[Math.floor(Math.random() * g.publicPool.length)];
            s({ type: 'game_pick_public', cardId: pc.id });
          }
        } else if (g.myHand.length > 0) {
          // Choose a hand card
          const hc = g.myHand[Math.floor(Math.random() * g.myHand.length)];
          s({ type: 'game_pick_hand', cardId: hc.id });

          // After a short delay either pick a public card or discard
          setTimeout(() => {
            const g2 = this.game;
            if (!g2 || g2.currentPlayer !== g2.mySlot || g2.isDiscarding) return;

            if (g2.publicPool.length > 0) {
              // 70% pick public, 30% discard
              if (Math.random() < 0.7) {
                const pc = g2.publicPool[Math.floor(Math.random() * g2.publicPool.length)];
                s({ type: 'game_pick_public', cardId: pc.id });
              } else {
                s({ type: 'game_discard_hand' });
              }
            }
          }, 500);
        }
        break;
      }

      case 'matching':
        if (g.currentPlayer === g.mySlot) {
          s({ type: 'game_dismiss_popup' });
        }
        break;
    }
  }

  reset(): void {
    this.game = null;
    if (this.timer) clearTimeout(this.timer);
  }
}
