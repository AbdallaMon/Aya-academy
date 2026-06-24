// kind → renderer map. The GamePlayer routes each question by its `kind`.
// PHONE_CALL is an alias of SCENARIO (both handled by ChoiceTask).

import ChoiceTask from "./ChoiceTask.jsx";
import DialpadTask from "./DialpadTask.jsx";
import ToneSliderTask from "./ToneSliderTask.jsx";
import TapCatchTask from "./TapCatchTask.jsx";
import MatchingTask from "./MatchingTask.jsx";
import CompassTask from "./CompassTask.jsx";
import CalendarDropTask from "./CalendarDropTask.jsx";
import ColoringTask from "./ColoringTask.jsx";
import BoardDiceTask from "./BoardDiceTask.jsx";

export const RENDERERS = {
  MULTIPLE_CHOICE: ChoiceTask,
  EMOJI_CHOICE: ChoiceTask,
  SCENARIO: ChoiceTask,
  PHONE_CALL: ChoiceTask,
  DIALPAD: DialpadTask,
  TONE_SLIDER: ToneSliderTask,
  TAP_CHOICE: TapCatchTask,
  // ── Phase D: 5 new animation-game kinds ──
  MATCHING: MatchingTask,
  COMPASS: CompassTask,
  CALENDAR_DROP: CalendarDropTask,
  COLORING: ColoringTask,
  BOARD_DICE: BoardDiceTask,
};

export function getRenderer(kind) {
  return RENDERERS[kind] || ChoiceTask;
}

export {
  ChoiceTask,
  DialpadTask,
  ToneSliderTask,
  TapCatchTask,
  MatchingTask,
  CompassTask,
  CalendarDropTask,
  ColoringTask,
  BoardDiceTask,
};
