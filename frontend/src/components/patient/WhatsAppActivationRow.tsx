import { useState } from 'react';
import type { Patient } from '../../types/patient';
import { IconWhatsapp, IconEdit } from '../icons';
import { useActivationLink } from '../../stores/whatsappStore';
import { useDeactivatePatient, useReactivatePatient } from '../../stores/patientStore';
import { useToastStore } from '../../stores/toastStore';
import { useAuthStore } from '../../stores/authStore';

interface WhatsAppActivationRowProps {
  patient: Patient;
  patientId: string;
  onEditPatient: () => void;
}

interface AiAccessControlProps {
  active: boolean;
  isPending: boolean;
  onToggle: () => void;
}

function AiAccessControl({ active, isPending, onToggle }: AiAccessControlProps) {
  if (active) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            color: 'var(--fg)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--sage)',
              display: 'inline-block',
            }}
          />
          IA Ativa
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: 11, padding: '3px 8px', color: 'var(--fg-muted)' }}
          onClick={onToggle}
          disabled={isPending}
          title="Pausar atendimento automático por IA via WhatsApp"
        >
          {isPending ? 'Aguarde...' : '⏸ Pausar IA'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 12,
          color: 'var(--coral)',
          fontFamily: 'var(--font-ui)',
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--coral)',
            display: 'inline-block',
          }}
        />
        IA Pausada
      </span>
      <button
        type="button"
        className="btn btn-ghost"
        style={{
          fontSize: 11,
          padding: '3px 10px',
          color: 'var(--sage)',
          borderColor: 'var(--sage)',
          fontWeight: 600,
        }}
        onClick={onToggle}
        disabled={isPending}
        title="Reativar atendimento automático por IA via WhatsApp"
      >
        {isPending ? 'Aguarde...' : '▶ Reativar IA'}
      </button>
    </div>
  );
}

function WhatsAppStatusIndicator({
  hasPhone,
  isActivated,
  isError,
  isMissingPhoneError,
}: {
  hasPhone: boolean;
  isActivated: boolean;
  isError: boolean;
  isMissingPhoneError: boolean;
}) {
  if (!hasPhone || isMissingPhoneError) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          fontFamily: 'var(--font-ui)',
        }}
      >
        <IconWhatsapp size={16} style={{ color: 'var(--fg-subtle)', flexShrink: 0 }} />
        <span style={{ color: 'var(--fg-muted)' }}>WhatsApp: Número não cadastrado</span>
      </div>
    );
  }

  if (isActivated) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          fontFamily: 'var(--font-ui)',
        }}
      >
        <IconWhatsapp size={16} style={{ color: 'var(--sage)', flexShrink: 0 }} />
        <span style={{ color: 'var(--fg)' }}>WhatsApp: Ativado</span>
        <span
          role="img"
          aria-label="WhatsApp ativado"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--sage)',
            display: 'inline-block',
          }}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          fontFamily: 'var(--font-ui)',
        }}
      >
        <IconWhatsapp size={16} style={{ color: 'var(--coral)', flexShrink: 0 }} />
        <span style={{ color: 'var(--fg-muted)' }}>Erro ao carregar link. Tente novamente.</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        fontFamily: 'var(--font-ui)',
      }}
    >
      <IconWhatsapp size={16} style={{ color: 'var(--fg-subtle)', flexShrink: 0 }} />
      <span style={{ color: 'var(--fg-muted)' }}>WhatsApp: Não ativado</span>
      <span
        role="img"
        aria-label="WhatsApp não ativado"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--fg-subtle)',
          display: 'inline-block',
        }}
      />
    </div>
  );
}

export function WhatsAppActivationRow({
  patient,
  patientId,
  onEditPatient,
}: WhatsAppActivationRowProps) {
  const [copied, setCopied] = useState(false);
  const hasPhone = patient.whatsapp != null && patient.whatsapp !== '';
  const { data: activationData, isError, error } = useActivationLink(hasPhone ? patientId : null);
  const showSuccess = useToastStore((s) => s.showSuccess);
  const showError = useToastStore((s) => s.showError);

  const deactivateMutation = useDeactivatePatient();
  const reactivateMutation = useReactivatePatient();

  const isActivated = activationData?.isActivated ?? false;
  const link = activationData?.link ?? '';

  const handleCopyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showSuccess('Link de ativação copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showSuccess('Link: ' + link);
    }
  };

  const isReadOnly = useAuthStore((s) => Boolean(s.user?.readOnly));
  const openReadOnlyModal = useAuthStore((s) => s.openReadOnlyModal);

  const isActive = patient.active !== false;

  const handleToggleAi = () => {
    if (isReadOnly) {
      openReadOnlyModal();
      return;
    }
    if (isActive) {
      deactivateMutation.mutate(patientId, {
        onSuccess: () => showSuccess('Acesso da IA pausado para este paciente.'),
        onError: () => showError('Erro ao pausar acesso da IA.'),
      });
    } else {
      reactivateMutation.mutate(patientId, {
        onSuccess: () => showSuccess('Acesso da IA reativado com sucesso!'),
        onError: () => showError('Erro ao reativar acesso da IA.'),
      });
    }
  };

  const isTogglingAi = deactivateMutation.isPending || reactivateMutation.isPending;

  const isMissingPhoneError = Boolean(
    error != null &&
    typeof error === 'object' &&
    'response' in error &&
    error.response != null &&
    typeof error.response === 'object' &&
    'status' in error.response &&
    error.response.status === 400,
  );

  const showEditButton = !hasPhone || isError;

  return (
    <div
      style={{
        padding: '8px 28px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <WhatsAppStatusIndicator
        hasPhone={hasPhone}
        isActivated={isActivated}
        isError={isError}
        isMissingPhoneError={isMissingPhoneError}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <AiAccessControl active={isActive} isPending={isTogglingAi} onToggle={handleToggleAi} />
        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
        {showEditButton ? (
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '4px 8px' }}
            onClick={onEditPatient}
          >
            <IconEdit size={10} /> Editar paciente
          </button>
        ) : (
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '4px 8px' }}
            onClick={handleCopyLink}
          >
            {copied ? '✓ Copiado' : isActivated ? 'Copiar link' : 'Gerar link'}
          </button>
        )}
      </div>
    </div>
  );
}
