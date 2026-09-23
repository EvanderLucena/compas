import type { NutritionistProfile } from '../../types';
import { IconSparkle, IconUsers } from '../icons';

interface ProfilePlanTabProps {
  profile: NutritionistProfile;
}

function PlanSummaryCard({
  tier,
  formattedEndsAt,
  daysRemaining,
  isReadOnly,
}: {
  tier: string;
  formattedEndsAt: string;
  daysRemaining: number;
  isReadOnly?: boolean;
}) {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: 8,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 4,
              background: isReadOnly ? 'var(--amber)' : 'var(--lime)',
              color: 'var(--ink)',
              letterSpacing: '0.04em',
            }}
          >
            {tier}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
            {tier === 'TRIAL' ? 'Período de Avaliação Gratuita' : `Plano ${tier}`}
          </span>
        </div>
        {isReadOnly ? (
          <span
            className="flex items-center gap-1.5"
            style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}
          >
            <span
              style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }}
            />
            Modo Leitura (Pausado)
          </span>
        ) : (
          <span
            className="flex items-center gap-1.5"
            style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 600 }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage)' }} />
            Conta Ativa
          </span>
        )}
      </div>

      {isReadOnly ? (
        <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
          Sua assinatura expirou. Seu acesso a consultas e download de documentos segue ativo em
          modo leitura.
        </div>
      ) : (
        formattedEndsAt && (
          <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            Válido até <strong>{formattedEndsAt}</strong> ({daysRemaining} dias restantes)
          </div>
        )
      )}
    </div>
  );
}

function PatientUsageCard({
  patientCount,
  limit,
  usagePercent,
  progressBarColor,
}: {
  patientCount: number;
  limit: number;
  usagePercent: number;
  progressBarColor: string;
}) {
  const remaining = limit - patientCount;
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: 8,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-2"
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}
        >
          <IconUsers size={16} />
          <span>Capacidade de Pacientes Ativos</span>
        </div>
        <span
          className="tnum font-mono"
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}
        >
          {patientCount} / {limit}
        </span>
      </div>

      <div
        style={{
          width: '100%',
          height: 8,
          borderRadius: 4,
          background: 'var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${usagePercent}%`,
            height: '100%',
            background: progressBarColor,
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>
        {remaining > 0
          ? `Você ainda pode cadastrar até ${remaining} pacientes ativos neste plano.`
          : 'Você atingiu o limite de pacientes ativos do plano Trial.'}
      </div>
    </div>
  );
}

function ProTeaserCard() {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: 8,
        background: 'rgba(212, 255, 79, 0.08)',
        border: '1px solid var(--border-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        className="flex items-center gap-2"
        style={{ color: 'var(--fg)', fontWeight: 600, fontSize: 13 }}
      >
        <IconSparkle size={16} color="var(--lime-dim)" />
        <span>Precisa de mais limites e inteligência?</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.5 }}>
        Em breve estarão disponíveis os planos Pro e Ilimitado, com capacidade expandida de
        pacientes, integração multi-WhatsApp e automações avançadas de adesão nutricional.
      </p>
    </div>
  );
}

export function ProfilePlanTab({ profile }: ProfilePlanTabProps) {
  const patientCount = profile.activePatientCount ?? 0;
  const limit = profile.patientLimit || 15;
  const usagePercent = Math.min(100, Math.round((patientCount / limit) * 100));

  let daysRemaining = 0;
  let formattedEndsAt = '';
  if (profile.trialEndsAt) {
    const end = new Date(profile.trialEndsAt);
    daysRemaining = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    formattedEndsAt = end.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const progressBarColor =
    usagePercent >= 90 ? 'var(--coral)' : usagePercent >= 70 ? 'var(--amber)' : 'var(--sage)';

  return (
    <div className="flex flex-col gap-4">
      <PlanSummaryCard
        tier={profile.subscriptionTier || 'TRIAL'}
        formattedEndsAt={formattedEndsAt}
        daysRemaining={daysRemaining}
        isReadOnly={profile.readOnly}
      />
      <PatientUsageCard
        patientCount={patientCount}
        limit={limit}
        usagePercent={usagePercent}
        progressBarColor={progressBarColor}
      />
      <ProTeaserCard />
    </div>
  );
}
