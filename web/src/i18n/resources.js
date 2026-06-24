// Pure (isomorphic) i18n helpers — safe to import from BOTH server and client
// code. No `next/headers`, no React. Keep server-only logic in ./index.js.

import { fallbackLng } from "./settings.js";

// Flatten `{ section: { ar, en } }` down to `{ section: <strings for lng> }`.
export function getLanguageResources(translationData, lng) {
  return Object.entries(translationData).reduce((acc, [section, value]) => {
    acc[section] = value?.[lng] || value?.[fallbackLng] || {};
    return acc;
  }, {});
}

// Build a `t(section, { returnObjects })` accessor over flattened resources.
export function makeT(resources) {
  return function t(section, options) {
    const value = resources[section];
    if (options?.returnObjects) return value ?? {};
    return value ?? section;
  };
}
