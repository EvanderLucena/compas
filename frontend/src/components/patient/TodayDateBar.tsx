interface TodayDateBarProps {
  selectedDate: string;
  todayStr: string;
  isToday: boolean;
  dateLabel: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  onSelectDate: (d: string) => void;
  onGoToday: () => void;
}

export function TodayDateBar({
  selectedDate,
  todayStr,
  isToday,
  dateLabel,
  onPrevDay,
  onNextDay,
  onSelectDate,
  onGoToday,
}: TodayDateBarProps) {
  return (
    <div
      className="today-date-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 20,
        padding: '10px 14px',
        background: 'var(--surface-2)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          data-testid="btn-prev-day"
          className="btn btn-ghost"
          style={{ padding: '5px 10px', fontSize: 13 }}
          onClick={onPrevDay}
          title="Ver dia anterior"
        >
          ◀
        </button>

        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '5px 14px',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              userSelect: 'none',
            }}
            title="Clique para abrir o calendário e escolher outra data"
          >
            <span style={{ fontSize: 14 }}>📅</span>
            <span>{dateLabel}</span>
            <span style={{ fontSize: 10, color: 'var(--fg-subtle)', marginLeft: 4 }}>▼</span>
            <input
              type="date"
              data-testid="date-picker-input"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => {
                if (e.target.value) onSelectDate(e.target.value);
              }}
              style={{
                position: 'absolute',
                opacity: 0,
                inset: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
              }}
            />
          </label>
        </div>

        <button
          data-testid="btn-next-day"
          className="btn btn-ghost"
          style={{ padding: '5px 10px', fontSize: 13, opacity: isToday ? 0.35 : 1 }}
          onClick={onNextDay}
          disabled={isToday}
          title={isToday ? 'Você já está no dia de hoje' : 'Ver próximo dia'}
        >
          ▶
        </button>

        {!isToday && (
          <button
            data-testid="btn-go-today"
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '4px 10px', marginLeft: 4 }}
            onClick={onGoToday}
          >
            Voltar para Hoje
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: 'var(--fg-muted)',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isToday ? 'var(--lime-dim)' : 'var(--fg-subtle)',
          }}
        />
        <span>{isToday ? 'Monitoramento em tempo real' : 'Visualizando dados históricos'}</span>
      </div>
    </div>
  );
}
