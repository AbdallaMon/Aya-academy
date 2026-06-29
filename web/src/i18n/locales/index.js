// Aggregates every translation section. Each export is shaped as
// `{ ar: {...}, en: {...} }`; `getLanguageResources` (in ../index.js) flattens
// it down to the active language before handing it to i18next.

export { messagesCodes } from "./messagesCodes.js";
export { tableData, dialogs, common } from "./common.js";
export { gamesData } from "./gamesData.js";
export { subscriptionLock } from "./subscriptionLock.js";
