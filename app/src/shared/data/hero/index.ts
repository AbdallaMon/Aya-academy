import { GiStarShuriken } from 'react-icons/gi';
import { TbWorld } from 'react-icons/tb';
import {
  HeroActionData,
  HeroImagesData,
  HeroTextData,
} from '../../../features/hero/types';

export const heroTextData: HeroTextData = {
  eyebrow: 'Quran for Kids in English',
  title: 'A Loving Quran Journey in English',
  description:
    'Simple, fun Quran lessons for kids aged 5–14, fully in English with clear recitation and meaning.',
  note: 'No Arabic required. Made for English-speaking families.',
  noteIcon: TbWorld,
};
export const heroActionData: HeroActionData = {
  journey: {
    text: "Start Your child's Journey",
    href: '/signup',
    icon: GiStarShuriken,
  },
  booking: {
    text: 'Book a Free Trial',
    href: '/booking',
  },
};
export const heroImagesData: HeroImagesData = {
  main: {
    src: {
      dark: '/hero-dark.png',
      light: '/hero-light.png',
    },
    alt: 'Ayah Academy Hero Image',
  },
  background: {
    src: {
      dark: '/hero-bg-dark.png',
      light: '/hero-bg-light.png',
    },
    alt: 'Hero Background',
  },
};
