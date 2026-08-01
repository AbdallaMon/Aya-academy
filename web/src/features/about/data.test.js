import test from 'node:test';
import assert from 'node:assert/strict';
import { getAboutContent, getAboutTeaserContent } from './data.js';

for (const language of ['ar', 'en']) {
  test(`about page has complete ${language} content`, () => {
    const content = getAboutContent(language);

    assert.ok(content.title.length > 20);
    assert.ok(content.description.length > 100);
    assert.equal(content.story.length, 2);
    assert.equal(content.audiences.length, 3);
    assert.equal(content.approach.length, 5);
    assert.ok(content.mission.length > 100);
    assert.ok(content.vision.length > 100);
    assert.ok(content.metaDescription.length >= 100);
  });

  test(`homepage about teaser stays concise in ${language}`, () => {
    const content = getAboutTeaserContent(language);

    assert.equal(content.audiences.length, 3);
    assert.ok(content.description.length < 250);
  });
}

test('English trust copy uses the approved plural wording', () => {
  const content = getAboutContent('en');
  assert.ok(content.approach.some((item) => item.title === 'Qualified and experienced teachers'));
});
