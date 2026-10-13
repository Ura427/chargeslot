export type SpeedTone = 'slow' | 'fast' | 'ultra';

export interface SpeedTier {
  label: 'Slow' | 'Fast' | 'Ultra-fast';
  tone: SpeedTone;
}

// Common UK/EU bands: AC up to 22 kW, DC rapid up to 50 kW, above that ultra-rapid.
export function speedTier(powerKw: number): SpeedTier {
  if (powerKw <= 22) return { label: 'Slow', tone: 'slow' };
  if (powerKw <= 50) return { label: 'Fast', tone: 'fast' };
  return { label: 'Ultra-fast', tone: 'ultra' };
}
