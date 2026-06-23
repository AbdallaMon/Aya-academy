import { Suspense } from "react";
import LeaderboardPage from "@/features/leaderboard/pages/LeaderboardPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <LeaderboardPage />
    </Suspense>
  );
}
