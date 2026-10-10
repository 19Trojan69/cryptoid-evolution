/** Existing HD artwork is shared with the collection; no duplicated downloads.
 * Each five-level stretch gets its own photographic scene instead of stretching
 * a small prototype image over the whole 4,894px region. */
export const galaxyScenery = [
  ['standard-01', 'standard-07', 'boss-15', 'boss-08', 'advanced-10', 'boss-31', 'standard-11', 'advanced-07', 'boss-50', 'standard-04'],
  ['advanced-11', 'standard-06', 'boss-18', 'elite-07', 'advanced-03', 'boss-44', 'elite-10', 'standard-10', 'boss-38', 'boss-13'],
  ['boss-26', 'standard-09', 'advanced-05', 'elite-11', 'boss-20', 'advanced-13', 'boss-12', 'boss-32', 'standard-15', 'advanced-02'],
  ['standard-07', 'boss-08', 'advanced-07', 'boss-43', 'standard-18', 'elite-04', 'boss-15', 'standard-04', 'boss-30', 'advanced-15'],
  ['boss-40', 'standard-08', 'boss-47', 'standard-19', 'boss-22', 'boss-05', 'advanced-17', 'elite-03', 'boss-28', 'standard-17'],
  ['boss-35', 'elite-08', 'boss-17', 'boss-48', 'advanced-19', 'boss-46', 'standard-12', 'elite-13', 'boss-06', 'elite-16'],
  ['boss-16', 'boss-38', 'boss-07', 'elite-09', 'boss-24', 'advanced-18', 'boss-21', 'standard-03', 'boss-44', 'standard-06'],
  ['boss-19', 'elite-17', 'boss-11', 'advanced-06', 'boss-28', 'elite-01', 'advanced-17', 'boss-49', 'standard-17', 'advanced-01'],
  ['boss-37', 'boss-39', 'boss-04', 'elite-14', 'standard-14', 'elite-02', 'standard-16', 'boss-25', 'standard-20', 'advanced-14'],
  ['singularity', 'boss-42', 'boss-07', 'boss-35', 'singularity', 'advanced-03', 'boss-10', 'boss-34', 'elite-10', 'boss-48'],
] as const;

export const galaxySceneryAsset = (id: string) => id === 'singularity'
  ? '/galaxy/final-singularity-hd.webp'
  : `/cards/space/unique/${id}.webp`;
