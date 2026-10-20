import words from '../data/words';
import { syncCuratedSharedWords } from '../services/wordService';

/** Legacy admin action now reconciles curated entries safely on every run. */
export default async function migrateToFirebase() {
  await syncCuratedSharedWords(words);
  return words.length;
}
