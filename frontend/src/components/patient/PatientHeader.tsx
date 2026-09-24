import { IconEdit } from '../icons';
import { WhatsAppActivationRow } from './WhatsAppActivationRow';
import type { DetailedPatient } from '../../types/patient';

export type Tab = 'today' | 'plan' | 'biometry' | 'prescriptions' | 'insights' | 'history';

import { HeaderStat } from './HeaderStat';

function PatientAvatar({
  initials,
  status,
}: {
  initials: string;
  status: DetailedPatient['status'];
}) {
  const badgeColor =
    status === 'ontrack'
      ? 'var(--sage)'
      : status === 'warning'
        ? 'var(--amber)'
        : status === 'danger'
          ? 'var(--coral)'
          : 'var(--border)';
  return (
    <div
      style={{
        width: 68,
        height: 68,
        borderRadius: '50%',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 22,
        fontWeight: 600,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {initials}
      <span
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: badgeColor,
          border: '3px solid var(--bg)',
        }}
      />
    </div>
  );
}

function PatientHeaderInfo({
  patient,
  latestBiometryWeight,
  onEditPatient,
}: {
  patient: DetailedPatient;
  latestBiometryWeight: number;
  onEditPatient: () => void;
}) {
  const ageLabel =
    Number.isFinite(patient.age) && patient.age > 0 ? `${patient.age} anos` : 'Idade não informada';
  const sexLabel =
    patient.sex === 'F' ? 'Feminino' : patient.sex === 'M' ? 'Masculino' : 'Sexo não informado';
  const heightLabel =
    patient.heightCm != null && patient.heightCm > 0
      ? `${patient.heightCm} cm`
      : 'Altura não informada';

  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <div
        className="eyebrow"
        style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
      >
        <span>
          Paciente · {(patient.id || '').toUpperCase()} · acompanhamento desde{' '}
          {patient.since || '—'}
        </span>
        {!patient.active && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--coral)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}
          >
            IA Pausada
          </span>
        )}
      </div>
      <h1
        className="serif"
        style={{
          fontSize: 36,
          margin: '4px 0 6px',
          fontWeight: 400,
          letterSpacing: '-0.02em',
        }}
      >
        {patient.name}
      </h1>
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          fontSize: 12.5,
          color: 'var(--fg-muted)',
          alignItems: 'center',
        }}
      >
        <span>
          {ageLabel} · {sexLabel}
        </span>
        <span>·</span>
        <span>
          {heightLabel} ·{' '}
          {Number.isFinite(latestBiometryWeight) && latestBiometryWeight > 0
            ? `${latestBiometryWeight} kg`
            : 'Peso não informado'}
        </span>
        <span>·</span>
        <span style={{ color: 'var(--fg)' }}>{patient.objective}</span>
        <button
          data-testid="btn-edit-patient-header"
          className="btn btn-ghost"
          style={{ fontSize: 11.5, padding: '3px 8px', marginLeft: 4 }}
          onClick={onEditPatient}
        >
          <IconEdit size={11} /> Editar
        </button>
      </div>
    </div>
  );
}

function fmtBiometryDate(iso: string | null | undefined): string {
  if (!iso) return 'Sem avaliação';
  const dateStr = iso.includes('T') ? iso : `${iso}T00:00:00`;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'Sem avaliação';
  return d.toLocaleDateString('pt-BR');
}

function PatientHeaderStats({
  adherence,
  status,
  latestBiometryWeight,
  latestBiometryBodyFat,
  latestBiometryDate,
  latestWeightDelta,
}: {
  adherence: number;
  status: DetailedPatient['status'];
  latestBiometryWeight: number;
  latestBiometryBodyFat: number | null;
  latestBiometryDate: string | null;
  latestWeightDelta: number;
}) {
  const fatSub = fmtBiometryDate(latestBiometryDate);
  const deltaPrefix = latestWeightDelta >= 0 ? '+' : '';
  return (
    <div
      className="patient-header-stats-row"
      style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}
    >
      <HeaderStat
        label="Adesão 7d"
        value={`${Number.isFinite(adherence) ? adherence : 0}%`}
        status={status || 'warning'}
      />
      <div
        className="patient-header-dividers"
        style={{ width: 1, height: 44, background: 'var(--border)' }}
      />
      <HeaderStat
        label="Peso"
        value={
          Number.isFinite(latestBiometryWeight) && latestBiometryWeight > 0
            ? `${latestBiometryWeight.toFixed(1)} kg`
            : '—'
        }
        sub={
          Number.isFinite(latestWeightDelta) && latestBiometryWeight > 0
            ? `${deltaPrefix}${latestWeightDelta.toFixed(1)} kg / 30d`
            : undefined
        }
        good={latestWeightDelta <= 0}
      />
      <div
        className="patient-header-dividers"
        style={{ width: 1, height: 44, background: 'var(--border)' }}
      />
      <HeaderStat
        label="% gordura"
        value={Number.isFinite(latestBiometryBodyFat) ? `${latestBiometryBodyFat}%` : '—'}
        sub={fatSub}
      />
    </div>
  );
}

import { PatientTabNav } from './PatientTabNav';

interface PatientHeaderProps {
  patient: DetailedPatient;
  patientId: string;
  tab: Tab;
  onSetTab: (t: Tab) => void;
  latestBiometryWeight: number;
  latestBiometryBodyFat: number | null;
  latestBiometryDate: string | null;
  latestWeightDelta: number;
  onEditPatient: () => void;
}

export function PatientHeader({
  patient,
  patientId,
  tab,
  onSetTab,
  latestBiometryWeight,
  latestBiometryBodyFat,
  latestBiometryDate,
  latestWeightDelta,
  onEditPatient,
}: PatientHeaderProps) {
  return (
    <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
      <div
        className="patient-header-row"
        style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}
      >
        <PatientAvatar initials={patient.initials} status={patient.status} />
        <PatientHeaderInfo
          patient={patient}
          latestBiometryWeight={latestBiometryWeight}
          onEditPatient={onEditPatient}
        />
        <PatientHeaderStats
          adherence={patient.adherence}
          status={patient.status}
          latestBiometryWeight={latestBiometryWeight}
          latestBiometryBodyFat={latestBiometryBodyFat}
          latestBiometryDate={latestBiometryDate}
          latestWeightDelta={latestWeightDelta}
        />
      </div>

      <WhatsAppActivationRow
        patient={patient}
        patientId={patientId}
        onEditPatient={onEditPatient}
      />

      <PatientTabNav tab={tab} onSetTab={onSetTab} />
    </div>
  );
}
