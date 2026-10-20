#!/usr/bin/env node
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, query, where, writeBatch, doc, serverTimestamp, terminate } = require("firebase/firestore");

async function main() {
  const { default: createWordPolicy } = await import("../src/data/wordPolicyCore.mjs");
  const { default: createCurationPlanner } = await import("../src/data/curationPlanCore.mjs");
  const wordPolicy = createWordPolicy(require("../src/data/word-curation.json"));
  const { getQuizPool, policy } = wordPolicy;
  const { buildCurationPlan } = createCurationPlanner(wordPolicy);
  const args = new Set(process.argv.slice(2));
  if ([...args].some((arg) => !["--apply", "--dry-run"].includes(arg)) || (args.has("--apply") && args.has("--dry-run"))) {
    throw new Error("Usage: node scripts/curate-shared-library.cjs [--dry-run | --apply]");
  }
  const root = path.resolve(__dirname, "..");
  const text = fs.readFileSync(path.join(root, "src/data/words.js"), "utf8");
  const words = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
  const app = initializeApp({ projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID, apiKey: process.env.REACT_APP_FIREBASE_API_KEY });
  const db = getFirestore(app);
  try {
    const read = async () => (await getDocs(query(collection(db, "words"), where("isGlobal", "==", true)))).docs.map((snapshot) => ({ ...snapshot.data(), id: snapshot.id }));
    const before = await read();
    const plan = buildCurationPlan(before, words);
    console.log(JSON.stringify({ version: policy.version, before: before.length, changes: plan.length,
      updates: plan.filter((item) => item.kind === "update").length,
      additions: plan.filter((item) => item.kind === "create").map((item) => item.word),
      archives: plan.filter((item) => item.kind === "archive").map(({ id, word, fields }) => ({ id, word, reason: fields.archiveReason })),
    }, null, 2));
    if (!args.has("--apply") || !plan.length) return;

    const backupDir = path.join(root, ".word-curation-backups");
    fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
    const backup = path.join(backupDir, `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    // Full previous fields, including timestamps, remain available for recovery.
    fs.writeFileSync(backup, JSON.stringify({ version: policy.version, before, plan, completedBatches: 0 }, null, 2), { mode: 0o600 });
    console.log(`Backup written: ${backup}`);
    for (let index = 0; index < plan.length; index += 400) {
      const batch = writeBatch(db);
      for (const item of plan.slice(index, index + 400)) {
        const ref = doc(db, "words", item.id);
        if (item.kind === "create") batch.set(ref, { ...item.fields, addedDate: serverTimestamp() }, { merge: true });
        else batch.update(ref, item.fields);
      }
      await batch.commit();
      const checkpoint = JSON.parse(fs.readFileSync(backup, "utf8"));
      checkpoint.completedBatches += 1;
      fs.writeFileSync(backup, JSON.stringify(checkpoint, null, 2), { mode: 0o600 });
    }
    const after = await read();
    const remaining = buildCurationPlan(after, words);
    if (remaining.length) throw new Error(`${remaining.length} changes remain after sync; rerun to reconcile.`);
    console.log(JSON.stringify({ after: after.length, unique: new Set(after.map((word) => word.word)).size,
      difficulties: Object.fromEntries(["beginner", "intermediate", "advanced"].map((level) => [level, after.filter((word) => word.difficulty === level).length])),
      quizPools: Object.fromEntries(["spelling", "warmup", "vocabulary"].map((mode) => [mode, getQuizPool(after, mode).length])),
      remainingChanges: remaining.length,
    }, null, 2));
  } finally { await terminate(db); }
}

main().catch((error) => { console.error(error.code || error.message); process.exitCode = 1; });
