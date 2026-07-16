/**
 * Anonymous "continue last game" persistence for single-player bot games.
 * Plain localStorage, one slot - no accounts, no Supabase. Starting a new
 * game just overwrites this slot, so there's never more than one resumable
 * game, by design.
 */

const STORAGE_KEY = 'scrabble_active_game';

export function saveActiveGameSnapshot(snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...snapshot, savedAt: Date.now() }));
  } catch (e) {
    // localStorage can throw (quota exceeded, private browsing) - persistence
    // is a nice-to-have here, never worth breaking the game over.
    console.warn('Could not save active game snapshot:', e);
  }
}

export function loadActiveGameSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Could not load active game snapshot:', e);
    return null;
  }
}

export function clearActiveGameSnapshot() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}
