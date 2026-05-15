export interface Card { id: string; name: string; description?: string; category?: string; image?: string; }
export type RelationType = 'prerequisite' | 'causal' | 'analogy' | 'generalization' | 'application';
export const RELATION_SCORES: Record<RelationType, number> = { prerequisite: 3, causal: 4, analogy: 2, generalization: 3, application: 3 };
export const RELATION_LABELS: Record<RelationType, string> = { prerequisite: '前置知识', causal: '因果关系', analogy: '类比概念', generalization: '泛化/特例', application: '实际应用' };
export interface Relation { cardA: string; cardB: string; type: RelationType; explanation: string; score?: number; }
export interface DeckMeta { name: string; description: string; author: string; version: string; }
export interface Deck { meta: DeckMeta; cards: Card[]; relations: Relation[]; }
export type PlayerSlot = 'player1' | 'player2';
export interface GameStateForPlayer {
  phase: 'coin_toss' | 'deck_select' | 'playing' | 'selecting-card' | 'matching' | 'round_over' | 'match_over';
  currentPlayer: PlayerSlot | null; myHand: Card[]; opponentHandCount: number; publicPool: Card[]; drawPileCount: number;
  myScore: number; opponentScore: number;
  mySettlement: Card[]; opponentSettlement: Card[];
  lastMatchResult: MatchResult | null; matchedPairs: MatchedPairPublic[];
  roundNumber: number; myRoundWins: number; opponentRoundWins: number; deckSelector: PlayerSlot;
  availableDeckIds: string[]; myDeckId: string | null; opponentDeckId: string | null;
  coinResult?: 'heads' | 'tails'; coinGuessed?: boolean; coinMyGuess?: 'heads' | 'tails'; mySlot: 'player1' | 'player2';
  selectedHandCard?: Card | null; hasMatchingPoolCard?: boolean;
  isDiscarding?: boolean;
}
export interface MatchResult { success: boolean; relation?: Relation; explanation?: string; score: number; }
export interface MatchedPairPublic { cardA: string; cardB: string; relationType: string; explanation: string; player: PlayerSlot; }
export interface FriendInfo { userId: string; nickname: string; online: boolean; }
export type ClientMessage =
  | { type: 'auth_login'; nickname: string; password?: string } | { type: 'auth_register'; nickname: string; password?: string }
  | { type: 'friend_add'; target: string } | { type: 'friend_list' } | { type: 'match_start' } | { type: 'match_cancel' }
  | { type: 'match_vs_bot' }
  | { type: 'invite_send'; target: string } | { type: 'invite_accept'; inviterId: string } | { type: 'invite_decline'; inviterId: string }
  | { type: 'game_coin_guess'; guess: 'heads' | 'tails' } | { type: 'game_select_deck'; deckId: string }
  | { type: 'game_pick_hand'; cardId: string } | { type: 'game_pick_public'; cardId: string }
  | { type: 'game_discard_hand' }
  | { type: 'game_dismiss_popup' } | { type: 'game_concede' };
export type ServerMessage =
  | { type: 'auth_ok'; userId: string; nickname: string } | { type: 'auth_error'; reason: string }
  | { type: 'player_online'; userId: string; nickname: string } | { type: 'player_offline'; userId: string }
  | { type: 'player_list'; players: { userId: string; nickname: string }[] } | { type: 'friend_list'; friends: FriendInfo[] }
  | { type: 'friend_added'; friend: FriendInfo } | { type: 'invite_received'; inviterId: string; inviterName: string }
  | { type: 'invite_cancelled'; inviterId: string } | { type: 'match_found'; opponentId: string; opponentName: string }
  | { type: 'match_timeout' } | { type: 'match_waiting'; position: number }
  | { type: 'game_start'; state: GameStateForPlayer } | { type: 'game_state'; state: GameStateForPlayer } | { type: 'game_error'; message: string };
