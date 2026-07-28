import test from "node:test";
import assert from "node:assert/strict";
import { getRecommendedProgramSlugs } from "./programRecommendations.js";

test("prioritizes the article's first topic and removes duplicate programs", () => {
  assert.deepEqual(
    getRecommendedProgramSlugs(["adults", "memorization"]),
    ["quran-classes-for-adults", "quran-memorization"],
  );
});

test("maps parent-focused content to child and Islamic studies programs", () => {
  assert.deepEqual(
    getRecommendedProgramSlugs(["parenting"]),
    ["quran-classes-for-kids", "islamic-studies"],
  );
});

test("ignores unknown categories and respects the requested limit", () => {
  assert.deepEqual(
    getRecommendedProgramSlugs(["unknown", "memorization"], 1),
    ["quran-memorization"],
  );
});
