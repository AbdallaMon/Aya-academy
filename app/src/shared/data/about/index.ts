import { TbWorld } from 'react-icons/tb';
import { FaChildren } from 'react-icons/fa6';
import { GoArrowUpRight } from 'react-icons/go';
import { AboutData } from '@/features/about/types';

export const aboutData: AboutData = {
  title: 'About Ayah',
  slogan:
    'A warm, English-first Quran journey designed for kids and supported by parents.',
  descriptionList: [
    'Ayah Academy helps children learn Quran recitation and meaning step-by-step in English.',
    'Built for ages 5–14 with gentle pacing, clear structure, and motivational badges.',
    'Parents get visibility and calm progress tracking—no pressure.',
  ],
  image: '/about-1.png',
  keyFeatures: [
    {
      title: 'English-first learning',
      icon: TbWorld,
      color: 'primary.main',
    },
    {
      title: 'Kid-friendly levels',
      icon: FaChildren,
      color: 'secondary.main',
    },
    {
      title: 'Progress & badges',
      icon: GoArrowUpRight,
      color: 'info.main',
    },
  ],
};
