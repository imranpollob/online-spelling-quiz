export default function createCurationPlanner({ policy, normalizeAnswer, canonicalSpelling, getWordPolicy }) {

  // Pure, deterministic planning: no network or writes. Preserve record IDs and history.
  function buildCurationPlan(records, defaultWords) {
    const groups = new Map();
    const changes = [];
    const defaultSet = new Set(defaultWords.map(canonicalSpelling));
    const archive = (record, reason) => changes.push({
      kind: "archive", id: record.id, word: record.word,
      fields: { archived: true, isGlobal: false, archiveReason: reason, curationVersion: policy.version },
    });
    for (const record of records) {
      if (!record.isGlobal || record.archived) continue;
      const original = normalizeAnswer(record.word);
      if (Object.prototype.hasOwnProperty.call(policy.retired, original)) {
        archive(record, policy.retired[original]);
        continue;
      }
      const canonical = canonicalSpelling(original);
      if (!groups.has(canonical)) groups.set(canonical, []);
      groups.get(canonical).push(record);
    }
    for (const [word, group] of groups) {
      group.sort((a, b) => Number(normalizeAnswer(b.word) === word) - Number(normalizeAnswer(a.word) === word) || a.id.localeCompare(b.id));
      const [keeper, ...duplicates] = group;
      const fields = getWordPolicy(keeper.word);
      if (!defaultSet.has(word) && !policy.beginnerWords.includes(word) && !policy.advancedWords.includes(word) && keeper.difficulty) fields.difficulty = keeper.difficulty;
      if (Object.entries(fields).some(([key, value]) => JSON.stringify(keeper[key]) !== JSON.stringify(value))) {
        changes.push({ kind: "update", id: keeper.id, word, fields });
      }
      for (const duplicate of duplicates) archive(duplicate, `Consolidated under ${word} (${keeper.id}); spelling variants remain accepted.`);
    }
    for (const word of new Set(defaultWords.map(canonicalSpelling))) {
      if (groups.has(word) || Object.prototype.hasOwnProperty.call(policy.retired, word)) continue;
      changes.push({ kind: "create", id: `curated-${encodeURIComponent(word)}`, word, fields: {
        ...getWordPolicy(word), isGlobal: true, userId: null, archived: false,
        category: "commonly-misspelled", source: `curation-${policy.version}`, createdBy: "system",
        usageCount: 0, tags: ["curated"],
      } });
    }
    return changes;
  }

  return { buildCurationPlan };
}
