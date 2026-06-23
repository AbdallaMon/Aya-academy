import { TitleDescription } from '@/shared/utlis/types';
import { IconType } from 'react-icons/lib';

export type LevelReward = {
  icon: IconType;
  text: string;
};
export type Level = TitleDescription & {
  number: number;
  ageRange: string;
  color: string;
  icon: IconType;
  reward: LevelReward;
};

export type LevelsData = TitleDescription & {
  subTitle: string;
  levels: Level[];
};
