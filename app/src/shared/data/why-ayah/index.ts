import { TbWorld } from 'react-icons/tb';
import { FiBookOpen, FiHeart } from 'react-icons/fi';
import { RiParentLine } from 'react-icons/ri';
import { WhyAyahData } from '@/features/whyAyah/types';

export const whyAyahData: WhyAyahData = {
  title: 'Why Aya Academy?',
  slogan:
    'A nurturing, English-first Quran journey designed for kids and supported by parents.',
  reasons: [
    {
      title: 'English-first explanations',
      description:
        'Everything explained in simple English for kids and parents.',
      icon: TbWorld,
      color: 'primary',
    },
    {
      title: 'Child-friendly pacing',
      description: 'Short lessons, repetition, and positive encouragement.',
      icon: FiHeart,
      color: 'secondary',
    },
    {
      title: 'Meaning, not just memorization',
      description:
        'Understanding what they recite builds deeper connection and love.',
      icon: FiBookOpen,
      color: 'info',
    },
    {
      title: 'Parent involvement',
      description:
        'Parents get clear progress tracking and gentle guidance to support their child’s learning journey.',
      icon: RiParentLine,
      color: 'warning',
    },
  ],
};
