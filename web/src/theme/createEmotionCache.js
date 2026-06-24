// RTL-aware emotion cache factory.
//
// For Arabic (RTL) we add the stylis-plugin-rtl plugin so MUI's emotion styles
// are flipped (padding-left -> padding-right, etc). For LTR we use a plain
// cache. The cache `key` differs per direction so MUI doesn't reuse flipped
// rules across a language switch.

import createCache from "@emotion/cache";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

export function createEmotionCache(direction = "ltr") {
  if (direction === "rtl") {
    return createCache({
      key: "muirtl",
      stylisPlugins: [prefixer, rtlPlugin],
    });
  }
  return createCache({ key: "mui" });
}
