// The single `translation` namespace bundle. Every section in ./index.js is
// spread in here, keyed by section name, each `{ ar, en }`. The i18n loader
// flattens to the active language.

import * as sections from "./index.js";

const translation = {
  ...sections,
};

export default translation;
