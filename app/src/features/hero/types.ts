import { Action } from '@/shared/types/general';
import { IconType } from 'react-icons/lib';

export type HeroTextData = {
  eyebrow: string;
  title: string;
  description: string;
  note: string;
  noteIcon: IconType;
};
export type HeroActionData = {
  journey: Action;
  booking: Action;
};

export type ThemeImageSrc = {
  dark: string;
  light: string;
};
export type HeroImagesData = {
  main: {
    src: ThemeImageSrc;
    alt: string;
  };
  background: {
    src: ThemeImageSrc;
    alt: string;
  };
};
