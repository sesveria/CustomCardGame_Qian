import { FileStore } from './FileStore.js'; import type { Deck, DeckMeta } from '../shared/protocol.js';
export class DeckStore {
  constructor(private store: FileStore) {}
  listDecks(): { id: string; meta: DeckMeta }[] { const ids = this.store.listJSON('decks'); const r: { id: string; meta: DeckMeta }[] = []; for (const id of ids) { const d = this.store.readJSON<Deck>(`decks/${id}.json`); if (d) r.push({ id, meta: d.meta }); } return r; }
  getDeck(id: string): Deck | null { return this.store.readJSON<Deck>(`decks/${id}.json`); }
  async addDeck(id: string, deck: Deck): Promise<void> { await this.store.writeJSON(`decks/${id}.json`, deck); }
}
