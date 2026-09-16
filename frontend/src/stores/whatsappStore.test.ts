import { describe, it, expect } from 'vitest';
import { mapExtractionsToTimelineEvents, useWhatsAppUIStore } from './whatsappStore';
import type { Extraction } from '../types/whatsapp';

describe('whatsappStore', () => {
  describe('mapExtractionsToTimelineEvents', () => {
    it('maps Extraction to TimelineEvent format with correct fields', () => {
      const extractions: Extraction[] = [
        {
          id: 'ext-1',
          mealLabel: 'Almoço',
          extractionRaw: 'Arroz, feijão, frango grelhado',
          items: [
            { name: 'Arroz', kcal: 200, prot: 4, carb: 40, fat: 1, grams: 150, sortOrder: 0 },
            { name: 'Feijão', kcal: 80, prot: 5, carb: 15, fat: 1, grams: 80, sortOrder: 1 },
            {
              name: 'Frango grelhado',
              kcal: 180,
              prot: 30,
              carb: 0,
              fat: 7,
              grams: 120,
              sortOrder: 2,
            },
          ],
          totalKcal: 460,
          totalProt: 39,
          totalCarb: 55,
          totalFat: 9,
          extractedAt: '2026-05-05T12:30:00',
        },
      ];

      const events = mapExtractionsToTimelineEvents(extractions);

      expect(events).toHaveLength(1);
      expect(events[0].kind).toBe('log');
      expect(events[0].meal).toBe('Almoço');
      expect(events[0].items).toEqual(['Arroz', 'Feijão', 'Frango grelhado']);
      expect(events[0].macros.kcal).toBe(460);
      expect(events[0].macros.prot).toBe(39);
      expect(events[0].macros.carb).toBe(55);
      expect(events[0].macros.fat).toBe(9);
      expect(events[0].time).toBeTruthy();
      expect(events[0].hasMessage).toBe(true);
      expect(events[0].rawItems).toHaveLength(3);
      expect(events[0].rawItems?.[0].name).toBe('Arroz');
    });

    it('handles empty extractions array', () => {
      const events = mapExtractionsToTimelineEvents([]);
      expect(events).toHaveLength(0);
    });

    it('uses fallback meal label when empty', () => {
      const extractions: Extraction[] = [
        {
          id: 'ext-2',
          mealLabel: '',
          extractionRaw: 'Café preto',
          items: [],
          totalKcal: 5,
          totalProt: 0,
          totalCarb: 1,
          totalFat: 0,
          extractedAt: '2026-05-05T07:00:00',
        },
      ];

      const events = mapExtractionsToTimelineEvents(extractions);
      expect(events[0].meal).toBe('Refeição');
    });

    it('truncates long extractionRaw text in label', () => {
      const longText = 'A'.repeat(100);
      const extractions: Extraction[] = [
        {
          id: 'ext-3',
          mealLabel: 'Jantar',
          extractionRaw: longText,
          items: [],
          totalKcal: 0,
          totalProt: 0,
          totalCarb: 0,
          totalFat: 0,
          extractedAt: '2026-05-05T20:00:00',
        },
      ];

      const events = mapExtractionsToTimelineEvents(extractions);
      expect(events[0].label.length).toBeLessThanOrEqual(63); // 60 chars + '...'
    });
  });

  describe('useWhatsAppUIStore', () => {
    it('initial state has activationModalOpen as false', () => {
      const state = useWhatsAppUIStore.getState();
      expect(state.activationModalOpen).toBe(false);
    });

    it('setActivationModalOpen toggles state', () => {
      useWhatsAppUIStore.getState().setActivationModalOpen(true);
      expect(useWhatsAppUIStore.getState().activationModalOpen).toBe(true);
      useWhatsAppUIStore.getState().setActivationModalOpen(false);
      expect(useWhatsAppUIStore.getState().activationModalOpen).toBe(false);
    });
  });
});
