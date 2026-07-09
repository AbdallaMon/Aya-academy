import {
  MdWifiTethering,
  MdHighlight,
  MdAbc,
  MdEmojiEmotions,
  MdAccountTree,
  MdTimer,
  MdStar,
  MdAutorenew,
} from "react-icons/md";

import LaserPointer from "../tools/LaserPointer.jsx";
import Spotlight from "../tools/Spotlight.jsx";
import LettersPanel from "../tools/LettersPanel.jsx";
import EmojiPanel from "../tools/EmojiPanel.jsx";
import TreePanel from "../tools/TreePanel.jsx";
import TimerWidget from "../tools/TimerWidget.jsx";
import NamePicker from "../tools/NamePicker.jsx";
import StarsBoard from "../tools/StarsBoard.jsx";

// The board's playful tool palette.
//   mode "exclusive" → a pointer-capturing overlay; only one on at a time (laser
//                      and spotlight can't coexist — they both own the cursor).
//   mode "panel"     → an independent widget/palette; several can be open at once.
export const BOARD_TOOLS = [
  { key: "laser", icon: MdWifiTethering, labelAr: "ليزر", labelEn: "Laser", mode: "exclusive", Component: LaserPointer },
  { key: "spotlight", icon: MdHighlight, labelAr: "كشاف", labelEn: "Spotlight", mode: "exclusive", Component: Spotlight },
  { key: "letters", icon: MdAbc, labelAr: "حروف ممغنطة", labelEn: "Magnetic letters", mode: "panel", Component: LettersPanel },
  { key: "emoji", icon: MdEmojiEmotions, labelAr: "ملصقات", labelEn: "Stickers", mode: "panel", Component: EmojiPanel },
  { key: "tree", icon: MdAccountTree, labelAr: "خريطة عناوين", labelEn: "Title map", mode: "panel", Component: TreePanel },
  { key: "timer", icon: MdTimer, labelAr: "مؤقت", labelEn: "Timer", mode: "panel", Component: TimerWidget },
  { key: "names", icon: MdAutorenew, labelAr: "عجلة الأسماء", labelEn: "Name wheel", mode: "panel", Component: NamePicker },
  { key: "stars", icon: MdStar, labelAr: "لوحة النجوم", labelEn: "Star board", mode: "panel", Component: StarsBoard },
];
