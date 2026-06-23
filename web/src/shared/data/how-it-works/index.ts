import { IoVideocamOutline } from 'react-icons/io5';
import { MdOutlinePersonAddAlt } from 'react-icons/md';
import { SlBadge } from 'react-icons/sl';

import { PiHeadphonesLight } from 'react-icons/pi';
import { HowItWorksData } from '../../../features/howItWorks/types';

export const howItWorksData: HowItWorksData = {
  title: 'How Aya Academy Works',
  description: 'Simple steps for kids and parents',
  steps: [
    {
      icon: MdOutlinePersonAddAlt,
      title: 'Sign up & choose level',
      description:
        "Tell us your child's age and experience. We match them to the right level.",
    },
    {
      icon: IoVideocamOutline,
      title: 'Live or guided lessons',
      description:
        'Kids join online sessions or follow bite-sized video lessons with clear English explanations.',
    },
    {
      icon: PiHeadphonesLight,
      title: 'Practice, recite, repeat',
      description:
        'Audio practice, slow recitation, and repetition help kids build confidence.',
    },
    {
      icon: SlBadge,
      title: 'Celebrate badges & progress',
      description:
        'Kids unlock stars and badges as they memorize and understand more.',
    },
  ],
};
