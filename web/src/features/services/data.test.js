import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  getService,
  programFamilies,
  programFamilyText,
  services,
  serviceText,
} from './data.js';

const expandedProgramSlugs = [
  'quran-memorization',
  'tajweed-courses',
  'arabic-reading',
  'arabic-speaking',
  'quranic-arabic',
  'islamic-studies',
];

for (const slug of expandedProgramSlugs) {
  for (const language of ['ar', 'en']) {
    test(`${slug} has useful ${language} program details`, () => {
      const copy = serviceText(getService(slug), language);

      assert.ok(copy.description.length >= 80);
      assert.ok(copy.audience.length >= 40);
      assert.ok(copy.format.length >= 40);
      assert.ok(copy.duration.length >= 20);
      assert.ok(copy.audienceItems.length >= 3);
      assert.ok(copy.focusItems.length >= 3);
      assert.ok(copy.lessonSteps.length >= 4);
      assert.ok(copy.faqs.length >= 3);
      assert.ok(copy.faqs.every((item) => item.q && item.a));
    });
  }
}

test('expanded program copy avoids unsupported result promises', () => {
  const unsupportedClaims = [
    /guaranteed/i,
    /master (?:the )?(?:quran|arabic|tajweed)/i,
    /fluent in \d+/i,
    /in 30 days/i,
    /مضمون/,
    /إتقان مضمون/,
    /خلال 30 يوم/,
    /شهادة معتمدة/,
  ];

  for (const slug of expandedProgramSlugs) {
    const service = getService(slug);
    const copy = JSON.stringify({ ar: service.ar, en: service.en });

    for (const claim of unsupportedClaims) {
      assert.doesNotMatch(copy, claim);
    }
  }
});

test('every program has complete bilingual search and sharing content', () => {
  for (const service of services) {
    for (const language of ['ar', 'en']) {
      const copy = serviceText(service, language);
      const ogImage = fileURLToPath(
        new URL(`../../../public/og/services/${service.slug}-${language}.png`, import.meta.url),
      );

      assert.ok(copy.title.length >= 20, `${service.slug}/${language} needs a useful title`);
      assert.ok(copy.description.length >= 80, `${service.slug}/${language} needs a useful description`);
      assert.ok(copy.keywords.length >= 3, `${service.slug}/${language} needs focused topics`);
      assert.ok(copy.faqs.length >= 3, `${service.slug}/${language} needs visible FAQs`);
      assert.ok(fs.existsSync(ogImage), `${service.slug}/${language} is missing its OG image`);
    }
  }
});

test('the official English name is consistently spelled Ayah Academy', () => {
  assert.doesNotMatch(JSON.stringify(services), /\bAya Academy\b/);
  assert.match(JSON.stringify(services), /\bAyah Academy\b/);
});

test('the official curriculum is complete and bilingual', () => {
  assert.deepEqual(programFamilies.map((family) => family.key), ['quran', 'arabic', 'islamic']);

  for (const family of programFamilies) {
    assert.ok(family.serviceKeys.length > 0);
    assert.ok(family.serviceKeys.every((key) => services.some((service) => service.key === key)));

    for (const language of ['ar', 'en']) {
      const copy = programFamilyText(family, language);
      assert.ok(copy.title.length > 5);
      assert.ok(copy.description.length > 40);
      assert.ok(copy.topics.length > 0);
      assert.ok(copy.topics.every((topic) => topic.length > 4));
    }
  }

  const englishTopics = programFamilies.flatMap((family) => family.en.topics);
  assert.ok(englishTopics.includes("Noor Al-Bayan and Qa'idah"));
  assert.ok(englishTopics.includes('Arabic Reading, Writing, Listening and Speaking'));
  assert.ok(englishTopics.includes('Tafsir of Selected Surahs'));
});
