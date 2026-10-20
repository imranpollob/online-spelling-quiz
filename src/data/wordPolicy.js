import policy from "./word-curation.json";
import createWordPolicy from "./wordPolicyCore.mjs";

const wordPolicy = createWordPolicy(policy);
export const { normalizeAnswer, canonicalSpelling, getWordPolicy, curateWord, isCorrectAnswer, getQuizPool } = wordPolicy;
export { policy };
export default wordPolicy;
