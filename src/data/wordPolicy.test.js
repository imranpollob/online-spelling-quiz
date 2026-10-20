import words from "./words";
import { policy, canonicalSpelling, normalizeAnswer, getWordPolicy, curateWord, isCorrectAnswer, getQuizPool } from "./wordPolicy.js";
import { buildCurationPlan } from "./curationPlan.js";

const record = (word, id = word) => ({ id, word, isGlobal: true });

test("curated defaults contain the 20 additions and no retired or duplicate spellings", () => {
  expect(words).toHaveLength(850);
  expect(new Set(words).size).toBe(words.length);
  expect(words.every((word) => canonicalSpelling(word) === word)).toBe(true);
  for (const addition of policy.additions) expect(words).toContain(addition.word);
  for (const removed of ["could of", "abbas", "miniscule", "cancelled", "neighbour", "fulfil", "judgement"]) expect(words).not.toContain(removed);
  expect(words).toContain("minuscule");
});

test("accepts standard equivalent variants, preserves distinct meanings and rejects disputed targets", () => {
  expect(isCorrectAnswer("neighbor", " NEIGHBOUR ")).toBe(true);
  expect(isCorrectAnswer("canceled", "cancelled")).toBe(true);
  expect(isCorrectAnswer("jewelry", "jewellery")).toBe(true);
  expect(isCorrectAnswer("minuscule", "miniscule")).toBe(false);
  expect(isCorrectAnswer("bare", "bear")).toBe(false);
  expect(isCorrectAnswer("practice", "practise")).toBe(false);
  expect(normalizeAnswer("all   ready")).not.toBe(normalizeAnswer("already"));
});

test("excludes homophones, context-dependent words, phrases, archived rows and retired targets", () => {
  const blocked = ["bare", "bear", "their", "there", "to", "too", "two", "great", "which", "kernel", "license", "practise", "minute", "lead", "desert", "all ready", "all together", "could of", "abbas"];
  expect(getQuizPool(blocked.map((word) => record(word)))).toEqual([]);
  expect(getQuizPool([{ ...record("broccoli"), archived: true }])).toEqual([]);
  expect(getQuizPool([{ ...record("customword"), requiresContext: true }])).toEqual([]);
});

test("deduplicates spelling families and keeps warm-up and vocabulary as separate quiz sets", () => {
  const records = ["neighbor", "neighbour", "money", "bourgeois", "broccoli"].map((word) => record(word));
  expect(getQuizPool(records).map((word) => word.word)).toEqual(["neighbor", "broccoli"]);
  expect(getQuizPool(records, "warmup").map((word) => word.word)).toEqual(["money"]);
  expect(getQuizPool(records, "vocabulary").map((word) => word.word)).toEqual(["bourgeois"]);
});

test("uses editorial levels, proper capitalization and safe dictionary lookups", () => {
  expect(getWordPolicy("eager").difficulty).toBe("beginner");
  expect(getWordPolicy("acquiesce").difficulty).toBe("advanced");
  expect(getWordPolicy("accommodation").difficulty).toBe("intermediate");
  expect(getWordPolicy("christmas").displayWord).toBe("Christmas");
  expect(getWordPolicy("constructor").word).toBe("constructor");
  expect(curateWord({ word: "customword", difficulty: "advanced" }).difficulty).toBe("advanced");
});

test("plans reversible consolidation and preserves unrelated fields and personal records", () => {
  const before = [record("neighbor", "original"), record("neighbour", "alias"), record("miniscule", "small"), record("abbas", "name1"), record("abbas", "name2"), record("could of", "grammar"), { ...record("privateword", "private"), isGlobal: false, userId: "reader" }];
  const plan = buildCurationPlan(before, ["neighbor", "minuscule", "broccoli"]);
  expect(plan.find((item) => item.id === "small").fields.word).toBe("minuscule");
  expect(plan.filter((item) => item.kind === "archive").map((item) => item.id)).toEqual(expect.arrayContaining(["name1", "name2", "alias", "grammar"]));
  expect(plan.some((item) => item.id === "private")).toBe(false);
  const after = new Map(before.map((entry) => [entry.id, { ...entry, usageCount: 42 }]));
  for (const change of plan) after.set(change.id, { ...after.get(change.id), ...change.fields, id: change.id });
  expect(after.get("original").usageCount).toBe(42);
  expect(buildCurationPlan([...after.values()], ["neighbor", "minuscule", "broccoli"])).toEqual([]);
});

test("fresh imports use stable IDs and a second import makes zero changes", () => {
  const first = buildCurationPlan([], words);
  expect(first).toHaveLength(850);
  const records = first.map((change) => ({ ...change.fields, id: change.id }));
  expect(buildCurationPlan(records, words)).toEqual([]);
  expect(new Set(records.map((entry) => entry.id)).size).toBe(850);
});
