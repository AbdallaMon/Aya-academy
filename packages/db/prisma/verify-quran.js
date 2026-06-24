// Standalone invariant check for quran.data.js. Run: node packages/db/prisma/verify-quran.js
import { SURAHS, JUZ, SEGMENTS } from "./data/quran.data.js";

const fail = (msg) => {
  console.error("INVALID:", msg);
  process.exit(1);
};

// 1. counts
if (SURAHS.length !== 114) fail(`expected 114 surahs, got ${SURAHS.length}`);
if (JUZ.length !== 30) fail(`expected 30 juz, got ${JUZ.length}`);

// 2. surah numbers 1..114 unique & ordered; total ayahs = 6236
const totalAyahs = SURAHS.reduce((s, x) => s + x.ayahCount, 0);
if (totalAyahs !== 6236) fail(`expected 6236 total ayahs, got ${totalAyahs}`);
SURAHS.forEach((s, i) => {
  if (s.number !== i + 1) fail(`surah at index ${i} has number ${s.number}`);
  if (!["MAKKI", "MADANI"].includes(s.revelationPlace))
    fail(`surah ${s.number} bad revelationPlace`);
});

// 3. juz numbers 1..30
JUZ.forEach((j, i) => {
  if (j.number !== i + 1) fail(`juz at index ${i} has number ${j.number}`);
});

// 4. every segment references a real surah/juz, ayah range within surah, from<=to
const ayahCountOf = new Map(SURAHS.map((s) => [s.number, s.ayahCount]));
for (const seg of SEGMENTS) {
  const max = ayahCountOf.get(seg.surah);
  if (!max) fail(`segment references unknown surah ${seg.surah}`);
  if (seg.juz < 1 || seg.juz > 30) fail(`segment bad juz ${seg.juz}`);
  if (seg.fromAyah < 1 || seg.toAyah > max || seg.fromAyah > seg.toAyah)
    fail(`segment surah ${seg.surah} bad range ${seg.fromAyah}-${seg.toAyah} (max ${max})`);
}

// 5. per surah, the union of its segments covers exactly 1..ayahCount with no gap/overlap
const bySurah = new Map();
for (const seg of SEGMENTS) {
  if (!bySurah.has(seg.surah)) bySurah.set(seg.surah, []);
  bySurah.get(seg.surah).push(seg);
}
for (const [surah, segs] of bySurah) {
  const sorted = [...segs].sort((a, b) => a.fromAyah - b.fromAyah);
  let expected = 1;
  for (const seg of sorted) {
    if (seg.fromAyah !== expected)
      fail(`surah ${surah} gap/overlap at ayah ${seg.fromAyah} (expected ${expected})`);
    expected = seg.toAyah + 1;
  }
  if (expected - 1 !== ayahCountOf.get(surah))
    fail(`surah ${surah} not fully covered (ends ${expected - 1}/${ayahCountOf.get(surah)})`);
}

// 6. all 114 surahs appear in at least one segment
if (bySurah.size !== 114) fail(`only ${bySurah.size}/114 surahs appear in segments`);

console.log(`OK: 114 surahs, 30 juz, ${SEGMENTS.length} segments, ${totalAyahs} ayahs.`);
