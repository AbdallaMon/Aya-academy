import { TitleDescription } from '@/shared/utlis/types';
import { IconType } from 'react-icons/lib';

export type Progress = {
  title: string;
  subTitle: string;
  total: number;
};
export type CompletedPart = {
  name: string;
  progress: number;
};
export type Badge = {
  name: string;
  icon: IconType;
  type: string;
};
export type StreakType = TitleDescription & {
  icon: IconType;
  days: number;
};
export type ChildsDashboardCardType = {
  title: string;
  progress: Progress;
  completedParts: CompletedPart[];
  badges: Badge[];
  streak: StreakType;
};
export type ChildsDashboardData = {
  title: string;
  features: string[];
  card: ChildsDashboardCardType;
};
