import { TitleDescription } from '@/shared/utlis/types';
import { IconType } from 'react-icons/lib';

export type Reason = TitleDescription & {
  icon: IconType;
  color: string;
};
export type WhyAyahData = {
  title: string;
  slogan: string;
  reasons: Reason[];
};
