import { randomInt } from "node:crypto";

const PRACTICE_GAME_SLUGS = new Set(["pillars-build", "wudu-steps"]);

function shuffle(items, pickIndex) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = pickIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Each of these two games has six three-choice questions. Randomize the choices
// on every game fetch while spreading correct answers across all three positions.
// Shuffle before stripAnswers derives correctIndices from the new array order.
export function shufflePracticeOptions(game, pickIndex = randomInt) {
  if (!PRACTICE_GAME_SLUGS.has(game?.slug) || !Array.isArray(game.questions)) {
    return game;
  }

  const choiceQuestions = game.questions.filter(
    (question) =>
      question.kind === "MULTIPLE_CHOICE" &&
      question.options?.length === 3 &&
      question.options.filter((option) => option.isCorrect).length === 1,
  );
  const correctPositions = shuffle(
    choiceQuestions.map((_, index) => index % 3),
    pickIndex,
  );
  let choiceIndex = 0;

  return {
    ...game,
    questions: game.questions.map((question) => {
      if (!choiceQuestions.includes(question)) return question;

      const correct = question.options.find((option) => option.isCorrect);
      const distractors = shuffle(
        question.options.filter((option) => !option.isCorrect),
        pickIndex,
      );
      const options = [...distractors];
      options.splice(correctPositions[choiceIndex], 0, correct);
      choiceIndex += 1;
      return { ...question, options };
    }),
  };
}
