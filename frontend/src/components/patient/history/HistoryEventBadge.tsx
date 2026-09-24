import {
  IconUsers,
  IconPlan,
  IconScale,
  IconWhatsapp,
  IconTrend,
  IconEdit,
  IconClock,
} from '../../icons';
import { getBadgeConfig } from './historyHelpers';

function renderEventIcon(eventType: string) {
  const t = eventType.toUpperCase();
  if (t.includes('CONSULTATION')) return <IconUsers size={13} />;
  if (t.includes('PLAN')) return <IconPlan size={13} />;
  if (t.includes('BIOMETRY')) return <IconScale size={13} />;
  if (t.includes('MEAL') || t.includes('EXTRACTION')) return <IconWhatsapp size={13} />;
  if (t.includes('PRESCRIPTION')) return <IconPlan size={13} />;
  if (t.includes('GOAL') || t.includes('MILESTONE')) return <IconTrend size={13} />;
  if (t.includes('NOTE')) return <IconEdit size={13} />;
  return <IconClock size={13} />;
}

export function HistoryEventBadge({ eventType }: { eventType: string }) {
  const config = getBadgeConfig(eventType);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        letterSpacing: '0.02em',
      }}
    >
      {renderEventIcon(eventType)}
      {config.label}
    </span>
  );
}
