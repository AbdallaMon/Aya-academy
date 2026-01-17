import { LevelsData } from '@/features/Levels/type';
import { MdBadge, MdStar } from 'react-icons/md';
import { SlBadge } from 'react-icons/sl';

export const levelsData: LevelsData = {
  title: 'Levels for Every Child',
  subTitle: 'From first letters to confident recitation.',
  description:
    'Aya Academy is organized into clear levels based on age and experience. Kids move forward at a pace that feels fun, not stressful.',

  levels: [
    {
      number: 1,
      title: 'Beginner',
      ageRange: 'Ages 4-6',
      description: 'Learn letters, basic sounds, and simple Surahs.',
      icon: SlBadge,
      color: 'secondary.main',
      reward: {
        text: 'First Surah Badge',
        icon: MdStar,
      },
    },
    {
      number: 2,
      title: 'Explorer',
      ageRange: 'Ages 7-9',
      description:
        'Short Surahs, tajweed basics, and easy meanings in English.',
      icon: SlBadge,
      color: 'primary.main',
      reward: {
        text: 'Explorer Badge',
        icon: MdStar,
      },
    },
    {
      number: 3,
      title: 'Builder',
      ageRange: 'Ages 9-11',
      description: 'Longer Surahs, stronger tajweed, understanding key themes.',
      icon: SlBadge,
      color: 'success.main',
      reward: {
        text: 'Builder Badge',
        icon: MdStar,
      },
    },

    {
      number: 4,
      title: 'Confident Reader',
      ageRange: 'Ages 12+',
      description:
        'Fluent recitation, deeper understanding, and personal reflection prompts.',
      icon: SlBadge,
      color: 'error.main',
      reward: {
        text: 'Quran Mastery Badge',
        icon: MdStar,
      },
    },
  ],
};
