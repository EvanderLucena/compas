import { describe, it, expect } from 'vitest';
import { CLINICAL_RADAR_QUERY_KEY } from './clinicalRadarStore';

describe('clinicalRadarStore', () => {
  it('defines stable query key for clinical radar', () => {
    expect(CLINICAL_RADAR_QUERY_KEY).toEqual(['clinical-radar']);
  });
});
