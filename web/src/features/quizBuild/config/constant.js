// Quiz-build endpoints (relative to the API base used by useRequest).
export const INVITES_URL = "quizzes/invites";
export const MY_STUDENTS_URL = "users/my-students";
export const QUIZZES_URL = "quizzes";

export function emptyCustomQuestion() {
  return {
    textAr: "",
    textEn: "",
    options: [
      { labelAr: "", labelEn: "", isCorrect: true },
      { labelAr: "", labelEn: "", isCorrect: false },
    ],
  };
}
