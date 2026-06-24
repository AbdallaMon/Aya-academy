export const surahSelect = {
  id: true,
  number: true,
  nameAr: true,
  nameEn: true,
  ayahCount: true,
  revelationPlace: true,
};

export const segmentSelect = {
  id: true,
  surahId: true,
  fromAyah: true,
  toAyah: true,
  order: true,
  surah: { select: { id: true, number: true, nameAr: true, nameEn: true, ayahCount: true } },
};

export const juzWithSegmentsSelect = {
  id: true,
  number: true,
  nameAr: true,
  nameEn: true,
  segments: { select: segmentSelect, orderBy: { order: "asc" } },
};

export const progressSelect = {
  id: true,
  segmentId: true,
  status: true,
  currentAyah: true,
  completedAt: true,
  updatedAt: true,
};
