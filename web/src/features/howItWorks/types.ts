import { TitleDescription } from '@/shared/utlis/types';
import { IconType } from 'react-icons/lib';

export type Step = TitleDescription & {
  icon: IconType;
};

export type HowItWorksData = TitleDescription & {
  steps: Step[];
};
