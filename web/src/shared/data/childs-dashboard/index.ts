import { MdStar } from 'react-icons/md';
import { GrAchievement } from 'react-icons/gr';
import { AiOutlineFire } from 'react-icons/ai';
import { ChildsDashboardData } from '@/features/childDashboard/types';

export const childsDashboardData: ChildsDashboardData = {
  title: 'See Every Step of Their Journey',
  features: [
    "Clear progress for each Juz' and level",
    "Badges like 'juz 1 Star' to motivate kids",
    'Parent-friendly dashboard in English',
    'Gentle reminders, not pressure',
  ],
  card: {
    title: "Your child's dashboard",
    progress: {
      title: 'Overall progress',
      subTitle: 'Keep up the great work!',
      total: 35,
    },
    completedParts: [
      {
        name: 'Juz 1',
        progress: 100,
      },
      {
        name: 'Juz 2',
        progress: 60,
      },
    ],
    badges: [
      {
        name: 'Juz 1 Star',
        icon: MdStar,
        type: 'secondary',
      },
      {
        name: 'Consistency Champ',
        icon: GrAchievement,
        type: 'primary',
      },
    ],
    streak: {
      title: ' Days Streak',
      description: 'Amazing consistency! Keep it up!',
      icon: AiOutlineFire,
      days: 5,
    },
  },
};
