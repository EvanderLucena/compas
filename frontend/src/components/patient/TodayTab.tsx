import { useMemo, useState } from 'react';
import type { DetailedPatient, MacroTarget } from '../../types/patient';
import type { MealPlan } from '../../types/plan';
import { WeekBars } from '../viz';
import {
  useExtractions,
  mapExtractionsToTimelineEvents,
  toLocalDateString,
} from '../../stores/whatsappStore';
import { TodayDateBar } from './TodayDateBar';
import { TodayPlanCard } from './TodayPlanCard';
import { TodayReportedCard } from './TodayReportedCard';
import { TodayTimelineCard } from './TodayTimelineCard';

import type { Tab } from './PatientHeader';

interface TodayTabProps {
  patient: DetailedPatient;
  patientId: string;
  plan: MealPlan | null;
  onSetTab: (t: Tab) => void;
}

function computeReportedMacros(
  extractions:
    { totalKcal?: number; totalProt?: number; totalCarb?: number; totalFat?: number }[] | undefined,
  timelineEvents: {
    kind: string;
    macros?: { kcal?: number; prot?: number; carb?: number; fat?: number };
  }[],
  fallbackMacros: {
    kcal: { actual: number };
    prot: { actual: number };
    carb: { actual: number };
    fat: { actual: number };
  },
  isToday: boolean,
) {
  if (extractions && extractions.length > 0) {
    return {
      kcal: Math.round(extractions.reduce((sum, ex) => sum + (Number(ex.totalKcal) || 0), 0)),
      prot: Math.round(extractions.reduce((sum, ex) => sum + (Number(ex.totalProt) || 0), 0)),
      carb: Math.round(extractions.reduce((sum, ex) => sum + (Number(ex.totalCarb) || 0), 0)),
      fat: Math.round(extractions.reduce((sum, ex) => sum + (Number(ex.totalFat) || 0), 0)),
    };
  }
  if (isToday) {
    const logs = timelineEvents.filter((ev) => ev.kind === 'log' && ev.macros);
    if (logs.length > 0) {
      return {
        kcal: Math.round(logs.reduce((sum, ev) => sum + (ev.macros?.kcal || 0), 0)),
        prot: Math.round(logs.reduce((sum, ev) => sum + (ev.macros?.prot || 0), 0)),
        carb: Math.round(logs.reduce((sum, ev) => sum + (ev.macros?.carb || 0), 0)),
        fat: Math.round(logs.reduce((sum, ev) => sum + (ev.macros?.fat || 0), 0)),
      };
    }
    return {
      kcal: fallbackMacros.kcal.actual,
      prot: fallbackMacros.prot.actual,
      carb: fallbackMacros.carb.actual,
      fat: fallbackMacros.fat.actual,
    };
  }
  return { kcal: 0, prot: 0, carb: 0, fat: 0 };
}

function formatDateInfo(selectedDate: string) {
  const [year, month, day] = selectedDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const today = new Date();
  const todayFormatted = toLocalDateString(today);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const yesterdayFormatted = toLocalDateString(yesterday);
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const monthName = d.toLocaleDateString('pt-BR', { month: 'long' });
  const shortMonth = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

  if (selectedDate === todayFormatted) {
    return {
      label: `Hoje · ${day} de ${monthName}`,
      short: 'hoje',
      dayOfWeekIndex: (d.getDay() + 6) % 7,
    };
  }
  if (selectedDate === yesterdayFormatted) {
    return {
      label: `Ontem · ${day} de ${monthName}`,
      short: 'ontem',
      dayOfWeekIndex: (d.getDay() + 6) % 7,
    };
  }
  const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return {
    label: `${capWeekday}, ${day} de ${monthName}`,
    short: `${day} de ${shortMonth}`,
    dayOfWeekIndex: (d.getDay() + 6) % 7,
  };
}

function computeWeekMacroFill(
  existingFill: number[] | undefined,
  kcalTarget: number,
  actualKcal: number,
  dayOfWeekIndex: number,
) {
  if (existingFill && existingFill.length === 7) return existingFill;
  const fillRatio = kcalTarget > 0 ? Math.min(1, actualKcal / kcalTarget) : 0;
  const fill = [0, 0, 0, 0, 0, 0, 0];
  fill[dayOfWeekIndex] = fillRatio;
  return fill;
}

export function TodayTab({ patient, patientId, plan, onSetTab }: TodayTabProps) {
  const todayStr = useMemo(() => toLocalDateString(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const isToday = selectedDate === todayStr;
  const dateInfo = useMemo(() => formatDateInfo(selectedDate), [selectedDate]);

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d - 1);
    setSelectedDate(toLocalDateString(date));
  };

  const handleNextDay = () => {
    if (selectedDate >= todayStr) return;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d + 1);
    const nextFormatted = toLocalDateString(date);
    if (nextFormatted <= todayStr) setSelectedDate(nextFormatted);
  };

  const {
    data: extractions,
    isLoading: extractionsLoading,
    isError: extractionsError,
  } = useExtractions(patientId, selectedDate);

  const extractionEvents = useMemo(
    () => (extractions ? mapExtractionsToTimelineEvents(extractions) : []),
    [extractions],
  );
  const timelineEvents = useMemo(
    () => (isToday ? [...extractionEvents, ...patient.timeline] : extractionEvents),
    [extractionEvents, patient.timeline, isToday],
  );

  const kcalTarget = plan?.kcalTarget ?? patient.macrosToday.kcal.target;
  const protTarget = plan?.protTarget ?? patient.macrosToday.prot.target;
  const carbTarget = plan?.carbTarget ?? patient.macrosToday.carb.target;
  const fatTarget = plan?.fatTarget ?? patient.macrosToday.fat.target;

  const reportedMacrosToday: MacroTarget = useMemo(() => {
    const actual = computeReportedMacros(extractions, timelineEvents, patient.macrosToday, isToday);
    return {
      kcal: { target: kcalTarget, actual: actual.kcal },
      prot: { target: protTarget, actual: actual.prot },
      carb: { target: carbTarget, actual: actual.carb },
      fat: { target: fatTarget, actual: actual.fat },
    };
  }, [
    extractions,
    timelineEvents,
    patient.macrosToday,
    isToday,
    kcalTarget,
    protTarget,
    carbTarget,
    fatTarget,
  ]);

  const mealCount = plan?.meals?.length ?? 6;
  const timelineCount = timelineEvents.filter((ev) => ev.kind === 'log').length;
  const hasTimelineData = timelineCount > 0;

  const weekMacroFill = useMemo(
    () =>
      computeWeekMacroFill(
        patient.weekMacroFill,
        kcalTarget,
        reportedMacrosToday.kcal.actual,
        dateInfo.dayOfWeekIndex,
      ),
    [patient.weekMacroFill, kcalTarget, reportedMacrosToday.kcal.actual, dateInfo.dayOfWeekIndex],
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      <TodayDateBar
        selectedDate={selectedDate}
        todayStr={todayStr}
        isToday={isToday}
        dateLabel={dateInfo.label}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onSelectDate={setSelectedDate}
        onGoToday={() => setSelectedDate(todayStr)}
      />

      <div
        className="today-cards-grid"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}
      >
        <TodayPlanCard
          mealCount={mealCount}
          kcalTarget={kcalTarget}
          protTarget={protTarget}
          carbTarget={carbTarget}
          fatTarget={fatTarget}
          hasTimelineData={hasTimelineData}
          onEditPlan={() => onSetTab('plan')}
        />
        <TodayReportedCard
          timelineCount={timelineCount}
          hasTimelineData={hasTimelineData}
          reportedMacrosToday={reportedMacrosToday}
        />
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="card-h">
          <div className="title">Adesão semanal</div>
          <div className="sub">SEG — DOM</div>
        </div>
        <div className="card-b">
          <WeekBars values={weekMacroFill} height={42} activeIndex={dateInfo.dayOfWeekIndex} />
        </div>
      </div>

      <TodayTimelineCard
        shortDate={dateInfo.short}
        dateLabel={dateInfo.label}
        isToday={isToday}
        extractionsLoading={extractionsLoading}
        extractionsError={extractionsError}
        timelineEvents={timelineEvents}
        patientId={patientId}
      />
    </div>
  );
}
