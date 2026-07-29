import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_URL,
  contactContent,
  getContactContent,
} from './data.js';
import {
  LEGAL_LAST_UPDATED,
  legalContent,
  getLegalContent,
} from '../legal/data.js';

test('contact details use the academy official channels', () => {
  assert.equal(CONTACT_EMAIL, 'info@ayah.academy');
  assert.equal(CONTACT_PHONE_DISPLAY, '+966 58 250 9655');
  assert.equal(CONTACT_WHATSAPP_URL, 'https://wa.me/966582509655');
});

test('contact content is complete in English and Arabic', () => {
  for (const lng of ['en', 'ar']) {
    const content = getContactContent(lng);
    assert.equal(content, contactContent[lng]);
    assert.match(content.title, lng === 'en' ? /Ayah Academy/ : /أكاديمية آية/);
    assert.ok(content.metaTitle.length > 20);
    assert.ok(content.metaDescription.length > 70);
    assert.equal(content.prepareItems.length, 4);
    assert.ok(content.email.action && content.whatsapp.action);
    assert.match(content.safetyNote, lng === 'en' ? /password/i : /كلمات المرور/);
  }
});

test('privacy and terms content is bilingual, dated and substantive', () => {
  assert.equal(LEGAL_LAST_UPDATED, '2026-07-29');

  for (const type of ['privacy', 'terms']) {
    for (const lng of ['en', 'ar']) {
      const content = getLegalContent(type, lng);
      assert.equal(content, legalContent[type][lng]);
      assert.ok(content.title);
      assert.ok(content.metaDescription.length > 70);
      assert.ok(content.sections.length >= 10);
      assert.ok(content.sections.every((section) => (
        section.title
        && ((section.paragraphs?.length || 0) + (section.bullets?.length || 0) > 0)
      )));
    }
  }
});

test('terms describe cancellation as a support request without a refund promise', () => {
  const english = getLegalContent('terms', 'en');
  const cancellation = english.sections.find((section) => (
    section.title === 'Scheduling, absence and cancellation'
  ));

  assert.ok(cancellation);
  const copy = cancellation.paragraphs.join(' ');
  assert.match(copy, /request subscription cancellation/i);
  assert.doesNotMatch(copy, /guaranteed refund|full refund/i);
});
