// Transcript for the student video review (public/videos/review.mp4).
// The spoken intro is kept faithful to what the student said (English + a greeting).
// The Quran recitation is the AUTHENTIC mushaf text of Surat Al-Masad (111) —
// auto-transcription garbles scripture, so the ayat are hand-verified here.
// The video plays as-is (no captions track).

export const reviewVideo = {
  src: '/videos/review.mp4',
  poster: '/videos/review-poster.jpg',
};

export const reviewVideoText = {
  ar: {
    eyebrow: 'فيديو من طلابنا',
    title: 'استمع لطالبة من أكاديمية آية',
    subtitle: 'طالبة تحب معلّمتها، تتعلّم القرآن والدعاء والعربية — وتتلو سورة المسد بنفسها.',
    showTranscript: 'اقرأ النص',
    hideTranscript: 'إخفاء النص',
    spokenLabel: 'ما قالته',
    reciteLabel: 'تلاوة سورة المسد',
    captionsNote: 'يحتوي على ترجمة نصية (CC)',
    attribution: 'طالبة في أكاديمية آية',
  },
  en: {
    eyebrow: 'A word from our students',
    title: 'Hear from a student at Aya Academy',
    subtitle: 'A student who loves her teacher and is learning Quran, du’aa and Arabic — reciting Surat Al-Masad herself.',
    showTranscript: 'Read transcript',
    hideTranscript: 'Hide transcript',
    spokenLabel: 'What she said',
    reciteLabel: 'Reciting Surat Al-Masad',
    captionsNote: 'Includes captions (CC)',
    attribution: 'Student at Aya Academy',
  },
};

// Spoken intro — exactly as said (bilingual by nature).
export const reviewSpoken = [
  'السلام عليكم',
  'I am a student from Sister Aya Academy.',
  'And I really love my teacher, Sister Aya.',
  'She teaches me Quran, du’aa, and Arabic.',
  'In shaa Allah, I’ll read you Surat Al-Masad.',
];

// Surat Al-Masad (111) — authentic mushaf text (isti'adha + basmala + 5 ayat).
export const reviewRecitation = [
  'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ',
  'مَا أَغْنَىٰ عَنْهُ مَالُهُ وَمَا كَسَبَ',
  'سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ',
  'وَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ',
  'فِي جِيدِهَا حَبْلٌ مِّن مَّسَدٍ',
];
