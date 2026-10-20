import words from '../data/words';
import { syncCuratedSharedWords } from '../services/wordService';

/** Repeated imports update the curated collection without adding duplicate records. */
export async function importAllWords() {
  return { success: true, ...await syncCuratedSharedWords(words) };
}

export default importAllWords;
