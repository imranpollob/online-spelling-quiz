export default function createWordPolicy(policy) {
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key) ? object[key] : undefined;

  const normalizeAnswer = (value) => String(value || "").trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[‐‑–]/g, "-").replace(/\s+/g, " ");
  const familyBySpelling = new Map();
  for (const family of policy.families) {
    for (const spelling of [family.word, ...family.acceptedSpellings]) familyBySpelling.set(spelling, family);
  }
  const contextWords = new Set([...policy.homophoneGroups.flat(), ...policy.contextOnlyWords]);
  const beginners = new Set(policy.beginnerWords);
  const advanced = new Set(policy.advancedWords);
  const warmups = new Set(policy.warmupWords);
  const vocabulary = new Set(policy.vocabularyWords);
  const additions = new Map(policy.additions.map((entry) => [entry.word, entry]));

  function canonicalSpelling(value) {
    const normalized = normalizeAnswer(value);
    const preferred = own(policy.preferredSpellings, normalized) || normalized;
    return familyBySpelling.get(preferred)?.word || preferred;
  }

  function getWordPolicy(value) {
    const original = normalizeAnswer(value);
    const word = canonicalSpelling(original);
    const requiresContext = contextWords.has(word) || /[\s'-]/.test(word);
    const practiceType = word === "abbas" ? "name" : word.includes(" ") ? "phrase" : warmups.has(word) ? "warmup" : requiresContext ? "context" : vocabulary.has(word) ? "vocabulary" : own(policy.properNouns, word) ? "proper-noun" : "spelling";
    const difficulty = additions.get(word)?.difficulty || (advanced.has(word) ? "advanced" : beginners.has(word) ? "beginner" : "intermediate");
    return {
      word,
      displayWord: own(policy.properNouns, word) || word,
      acceptedSpellings: [word, ...(familyBySpelling.get(word)?.acceptedSpellings || [])],
      difficulty,
      practiceType,
      requiresContext,
      audioQuizEligible: !requiresContext && !own(policy.retired, original) && !own(policy.retired, word),
      usageNote: own(policy.usageNotes, word) || (requiresContext ? "Use a definition or sentence to identify the intended word." : ""),
      ...(word === "minuscule" ? { commonMistakes: ["miniscule"] } : {}),
      curationVersion: policy.version,
    };
  }

  function curateWord(record) {
    const curated = getWordPolicy(record.word);
    // Stored editorial/user levels are retained; the sync explicitly updates curated levels.
    const requiresContext = curated.requiresContext || record.requiresContext === true;
    return { ...record, ...curated, requiresContext,
      audioQuizEligible: curated.audioQuizEligible && !requiresContext && record.audioQuizEligible !== false,
      usageNote: curated.usageNote || record.usageNote || "",
      difficulty: record.difficulty || curated.difficulty };
  }

  function isCorrectAnswer(record, answer) {
    const word = typeof record === "string" ? record : record.word;
    const variants = typeof record === "string" ? getWordPolicy(word).acceptedSpellings : (record.acceptedSpellings || getWordPolicy(word).acceptedSpellings);
    return variants.some((variant) => normalizeAnswer(variant) === normalizeAnswer(answer));
  }

  function getQuizPool(records, mode = "spelling") {
    const unique = new Map();
    for (const record of records) {
      if (record.archived || own(policy.retired, normalizeAnswer(record.word))) continue;
      const word = curateWord(record);
      if (!word.audioQuizEligible) continue;
      const inMode = mode === "spelling" ? ["spelling", "proper-noun"].includes(word.practiceType) : word.practiceType === mode;
      if (inMode && !unique.has(word.word)) unique.set(word.word, word);
    }
    return [...unique.values()];
  }

  return { policy, normalizeAnswer, canonicalSpelling, getWordPolicy, curateWord, isCorrectAnswer, getQuizPool };
}
