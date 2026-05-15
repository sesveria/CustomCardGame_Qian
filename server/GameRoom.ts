import WebSocket from 'ws';
import type { Card, Deck, Relation, GameStateForPlayer, MatchedPairPublic, PlayerSlot } from '../shared/protocol.js';
import { RELATION_SCORES } from '../shared/protocol.js';

const HAND_SIZE = 5;
const POOL_SIZE = 8;

interface FullGameState {
  deck: Deck;
  drawPile: Card[];
  publicPool: Card[];
  hands: Record<PlayerSlot, Card[]>;
  settlement: Record<PlayerSlot, Card[]>;
  scores: Record<PlayerSlot, number>;
  currentPlayer: PlayerSlot;
  selectedHandCard: Card | null;
  matchedPairs: MatchedPairPublic[];
  lastMatchResult: any | null;
  phase: 'selecting-card' | 'matching' | 'round_over';
  isDiscarding: boolean;
  discardedCardId: string | null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function findRelation(cardA: Card, cardB: Card, relations: Relation[]): Relation | null {
  for (const r of relations) {
    if ((r.cardA === cardA.id && r.cardB === cardB.id) || (r.cardA === cardB.id && r.cardB === cardA.id)) return r;
  }
  return null;
}

function findAnyMatchingRelation(card: Card, pool: Card[], relations: Relation[]): boolean {
  for (const pc of pool) {
    if (findRelation(card, pc, relations)) return true;
  }
  return false;
}

/**
 * Recalculate score for a player's settlement zone.
 * Scores every relation where BOTH cards live in that player's settlement.
 */
function recalcSettlementScore(
  settlement: Card[],
  relations: Relation[],
  _relScores: Record<string, number>,
): number {
  let total = 0;
  for (const r of relations) {
    const aIn = settlement.some(c => c.id === r.cardA);
    const bIn = settlement.some(c => c.id === r.cardB);
    if (aIn && bIn) {
      total += r.score ?? (RELATION_SCORES[r.type] ?? 3);
    }
  }
  return total;
}

function drawFromPile(pile: Card[], needed: number): { remaining: Card[]; drawn: Card[] } {
  if (needed <= 0) return { remaining: pile, drawn: [] };
  if (pile.length <= needed) return { remaining: [], drawn: [...pile] };
  return { remaining: pile.slice(needed), drawn: pile.slice(0, needed) };
}

function opp(p: PlayerSlot): PlayerSlot {
  return p === 'player1' ? 'player2' : 'player1';
}

type RoomPhaseType = 'coin_toss' | 'deck_select' | 'playing' | 'match_over';

export class GameRoom {
  id: string;
  players: [string, string];
  private wsMap: Record<string, WebSocket>;
  private nicknames: Record<string, string>;
  private deckIds: string[];
  private decks: Record<string, Deck> = {};

  round: number = 0;
  deckSelector: PlayerSlot = 'player1';
  phase: RoomPhaseType = 'coin_toss';
  gameState: FullGameState | null = null;

  coinResult: 'heads' | 'tails' | null = null;
  coinGuesses: Partial<Record<PlayerSlot, 'heads' | 'tails'>> = {};
  coinTimer: NodeJS.Timeout | null = null;
  selectedDecks: Partial<Record<PlayerSlot, string>> = {};

  private onMatchEnd: ((winnerId: string | null) => void) | null = null;

  private botUserId: string | null = null;
  private onBotState: ((state: GameStateForPlayer) => void) | null = null;

  constructor(
    id: string,
    p1: string, p1nick: string, ws1: WebSocket,
    p2: string, p2nick: string, ws2: WebSocket,
    deckIds: string[],
  ) {
    this.id = id;
    this.players = [p1, p2];
    this.wsMap = { [p1]: ws1, [p2]: ws2 };
    this.nicknames = { [p1]: p1nick, [p2]: p2nick };
    this.deckIds = deckIds;
  }

  markBot(userId: string, onState: (state: GameStateForPlayer) => void): void {
    this.botUserId = userId;
    this.onBotState = onState;
  }

  setDeck(id: string, deck: Deck): void { this.decks[id] = deck; }

  setCallbacks(
    _onRoundEnd: (winnerId: string) => void,
    onMatchEnd: (winnerId: string | null) => void,
  ): void {
    this.onMatchEnd = onMatchEnd;
  }

  startMatch(): void {
    this.coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
    this.coinGuesses = {};
    this.phase = 'coin_toss';
    this.round = 0;
    if (this.coinTimer) clearTimeout(this.coinTimer);
    this.coinTimer = setTimeout(() => this.resolveCoinToss(), 30_000);
    this.pushBoth();
  }

  submitCoinGuess(playerId: string, guess: 'heads' | 'tails'): void {
    const slot = this.slot(playerId);
    if (!slot || this.phase !== 'coin_toss') return;
    this.coinGuesses[slot] = guess;
    this.pushBoth();
    if (this.coinGuesses.player1 && this.coinGuesses.player2) {
      if (this.coinTimer) clearTimeout(this.coinTimer);
      this.resolveCoinToss();
    }
  }

  private resolveCoinToss(): void {
    const p1Win = this.coinGuesses.player1 === this.coinResult;
    const selector: PlayerSlot = p1Win ? 'player1' : 'player2';
    this.deckSelector = selector;
    this.selectedDecks = {};
    this.phase = 'deck_select';
    this.pushBoth();
  }

  selectDeck(playerId: string, deckId: string): void {
    const slot = this.slot(playerId);
    if (!slot || this.phase !== 'deck_select' || slot !== this.deckSelector) return;
    if (!this.deckIds.includes(deckId)) return;
    this.selectedDecks[slot] = deckId;
    const oppSlot = opp(slot);
    if (!this.selectedDecks[oppSlot]) {
      this.selectedDecks[oppSlot] = this.deckIds.find(d => d !== deckId) ?? deckId;
    }
    this.round = 1;
    this.startRound();
  }

  private startRound(): void {
    const selDeckId = this.selectedDecks[this.deckSelector] ?? this.deckIds[0];
    const activeDeck = this.decks[selDeckId];
    if (!activeDeck) return;

    const shuffled = shuffle([...activeDeck.cards]);
    const pool = shuffled.splice(0, POOL_SIZE);
    const hand1 = shuffled.splice(0, HAND_SIZE);
    const hand2 = shuffled.splice(0, HAND_SIZE);

    this.gameState = {
      deck: activeDeck,
      drawPile: shuffled,
      publicPool: pool,
      hands: { player1: hand1, player2: hand2 },
      settlement: { player1: [], player2: [] },
      scores: { player1: 0, player2: 0 },
      currentPlayer: this.deckSelector,
      selectedHandCard: null,
      matchedPairs: [],
      lastMatchResult: null,
      phase: 'selecting-card',
      isDiscarding: false,
      discardedCardId: null,
    };
    this.phase = 'playing';

    // Check if current player has no hand cards (shouldn't happen at game start, but be safe)
    if ((this.gameState.hands[this.gameState.currentPlayer] ?? []).length === 0) {
      this.endGame();
      return;
    }

    this.pushBoth();
  }

  pickHandCard(playerId: string, cardId: string): void {
    const slot = this.slot(playerId);
    const gs = this.gameState;
    if (!slot || !gs || gs.phase !== 'selecting-card' || gs.currentPlayer !== slot) return;
    if (gs.isDiscarding) return;
    const card = gs.hands[slot].find(c => c.id === cardId);
    if (!card) return;
    gs.selectedHandCard = card;
    this.pushBoth();
  }

  pickPublicCard(playerId: string, cardId: string): void {
    const slot = this.slot(playerId);
    const gs = this.gameState;
    if (!slot || !gs || gs.phase !== 'selecting-card' || gs.currentPlayer !== slot) return;

    // ── Post-discard pool pick ──
    if (gs.isDiscarding) {
      const poolCard = gs.publicPool.find(c => c.id === cardId);
      if (!poolCard) return;
      if (cardId === gs.discardedCardId) return;

      gs.publicPool = gs.publicPool.filter(c => c.id !== cardId);
      gs.hands[slot].push(poolCard);

      gs.isDiscarding = false;
      gs.discardedCardId = null;
      gs.selectedHandCard = null;
      gs.lastMatchResult = { success: false, score: 0, explanation: '从公共牌池换得一张牌' };

      gs.phase = 'matching';
      this.pushBoth();
      return;
    }

    // ── Normal match attempt ──
    if (!gs.selectedHandCard || gs.currentPlayer !== slot) return;
    const publicCard = gs.publicPool.find(c => c.id === cardId);
    if (!publicCard) return;
    const handCard = gs.selectedHandCard;
    const relation = findRelation(handCard, publicCard, gs.deck.relations);

    // Whether match or not: BOTH cards go to settlement
    // Remove hand card from hand
    gs.hands[slot] = gs.hands[slot].filter(c => c.id !== handCard.id);
    // Remove public card from pool
    gs.publicPool = gs.publicPool.filter(c => c.id !== cardId);

    // Add both to settlement
    gs.settlement[slot].push(handCard);
    gs.settlement[slot].push(publicCard);

    // Recalc settlement score for this player
    gs.scores[slot] = recalcSettlementScore(gs.settlement[slot], gs.deck.relations, RELATION_SCORES);

    if (relation) {
      gs.matchedPairs.push({
        cardA: handCard.name, cardB: publicCard.name,
        relationType: relation.type, explanation: relation.explanation, player: slot,
      });
      const score = relation.score ?? (RELATION_SCORES[relation.type] ?? 3);
      gs.lastMatchResult = { success: true, relation, explanation: relation.explanation, score };
    } else {
      gs.lastMatchResult = { success: false, score: 0, explanation: '没有关联，双方卡牌进入结算区' };
    }

    // Refill public pool from draw pile (1 card)
    const { remaining, drawn } = drawFromPile(gs.drawPile, 1);
    gs.drawPile = remaining;
    gs.publicPool = [...gs.publicPool, ...drawn];

    gs.selectedHandCard = null;

    // Check if current player has no hand cards → game over
    if (gs.hands[slot].length === 0) {
      this.endGame();
      return;
    }

    gs.phase = 'matching';
    this.pushBoth();
  }

  /** Discard hand card to pool, then player picks from pool (two-step) */
  discardHandCard(playerId: string): void {
    const slot = this.slot(playerId);
    const gs = this.gameState;
    if (!slot || !gs || gs.phase !== 'selecting-card' || gs.currentPlayer !== slot) return;
    if (!gs.selectedHandCard) return;
    if (gs.publicPool.length === 0) return;

    const handCard = gs.selectedHandCard;

    gs.publicPool.push(handCard);
    gs.hands[slot] = gs.hands[slot].filter(c => c.id !== handCard.id);

    gs.selectedHandCard = null;
    gs.isDiscarding = true;
    gs.discardedCardId = handCard.id;

    this.pushBoth();
  }

  dismissPopup(playerId: string): void {
    const slot = this.slot(playerId);
    const gs = this.gameState;
    if (!slot || !gs || gs.phase !== 'matching' || gs.currentPlayer !== slot) return;

    gs.lastMatchResult = null;

    // Switch turn
    gs.currentPlayer = opp(slot);

    // Check if the next player has no hand cards → game over
    if ((gs.hands[gs.currentPlayer] ?? []).length === 0) {
      this.endGame();
      return;
    }

    gs.phase = 'selecting-card';
    this.pushBoth();
  }

  private endGame(): void {
    const gs = this.gameState;
    if (!gs) return;

    gs.phase = 'round_over';
    this.phase = 'match_over';

    let winnerId: string | null = null;
    if (gs.scores.player1 > gs.scores.player2) {
      winnerId = this.players[0];
    } else if (gs.scores.player2 > gs.scores.player1) {
      winnerId = this.players[1];
    }

    this.pushBoth();
    this.onMatchEnd?.(winnerId);
  }

  concede(playerId: string): void {
    const slot = this.slot(playerId);
    if (!slot) return;
    const winner = opp(slot);
    const winnerId = this.players[winner === 'player1' ? 0 : 1];
    this.phase = 'match_over';
    this.onMatchEnd?.(winnerId);
  }

  finishMatch(): void {
    const s1 = this.buildState('player1'); s1.phase = 'match_over';
    const s2 = this.buildState('player2'); s2.phase = 'match_over';
    this.send('player1', { type: 'game_state', state: s1 });
    this.send('player2', { type: 'game_state', state: s2 });
  }

  private slot(playerId: string): PlayerSlot | null {
    if (playerId === this.players[0]) return 'player1';
    if (playerId === this.players[1]) return 'player2';
    return null;
  }

  private send(playerSlot: PlayerSlot, msg: any): void {
    const pid = this.players[playerSlot === 'player1' ? 0 : 1];
    if (pid === this.botUserId) {
      if (msg.type === 'game_state' || msg.type === 'game_start') {
        this.onBotState?.(msg.state);
      }
      return;
    }
    const ws = this.wsMap[pid];
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }

  private pushBoth(): void {
    this.send('player1', { type: 'game_state', state: this.buildState('player1') });
    this.send('player2', { type: 'game_state', state: this.buildState('player2') });
  }

  private buildState(slot: PlayerSlot): GameStateForPlayer {
    const gs = this.gameState;
    const oppSlot = opp(slot);

    const base: GameStateForPlayer = {
      phase: this.phase as any,
      currentPlayer: null, myHand: [], opponentHandCount: 0, publicPool: [], drawPileCount: 0,
      myScore: 0, opponentScore: 0,
      mySettlement: [], opponentSettlement: [],
      lastMatchResult: null, matchedPairs: [],
      roundNumber: this.round,
      myRoundWins: 0,
      opponentRoundWins: 0,
      deckSelector: this.deckSelector,
      availableDeckIds: this.deckIds,
      myDeckId: this.selectedDecks[slot] ?? null,
      opponentDeckId: this.selectedDecks[oppSlot] ?? null,
      coinResult: this.coinResult ?? undefined,
      coinGuessed: !!this.coinGuesses[slot],
      coinMyGuess: this.coinGuesses[slot],
      mySlot: slot,
      isDiscarding: false,
    };

    if (gs) {
      base.currentPlayer = gs.currentPlayer;
      base.myHand = gs.hands[slot] ?? [];
      base.opponentHandCount = (gs.hands[oppSlot] ?? []).length;
      base.publicPool = gs.publicPool;
      base.drawPileCount = gs.drawPile.length;
      base.myScore = gs.scores[slot] ?? 0;
      base.opponentScore = gs.scores[oppSlot] ?? 0;
      base.mySettlement = gs.settlement[slot] ?? [];
      base.opponentSettlement = gs.settlement[oppSlot] ?? [];
      base.lastMatchResult = gs.lastMatchResult ?? null;
      base.matchedPairs = gs.matchedPairs;
      base.isDiscarding = gs.isDiscarding;
      base.selectedHandCard = gs.selectedHandCard ?? null;
      base.hasMatchingPoolCard = gs.selectedHandCard && !gs.isDiscarding
        ? findAnyMatchingRelation(gs.selectedHandCard, gs.publicPool, gs.deck.relations)
        : undefined;
      base.phase = gs.phase as any;
    }

    return base;
  }

  hasPlayer(userId: string): boolean {
    return this.players[0] === userId || this.players[1] === userId;
  }

  getOtherPlayer(userId: string): { id: string; nickname: string } | null {
    const other = userId === this.players[0] ? this.players[1] : this.players[0];
    return { id: other, nickname: this.nicknames[other] };
  }
}
