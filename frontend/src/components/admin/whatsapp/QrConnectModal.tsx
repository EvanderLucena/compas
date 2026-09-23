import { useEffect, useRef, useId, useState, useCallback } from 'react';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { IconX, IconRefresh, IconCheck, IconWhatsapp } from '../../icons';
import {
  useConnectFleetInstance,
  useSyncFleetInstance,
  useAdminWhatsappUIStore,
} from '../../../stores/adminWhatsappStore';
import type { WhatsAppFleetInstance } from '../../../types/whatsappFleet';

interface QrConnectModalProps {
  instance: WhatsAppFleetInstance;
  onClose: () => void;
}

export function QrConnectModal({ instance, onClose }: QrConnectModalProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  const qrData = useAdminWhatsappUIStore((s) => s.qrData);
  const setQrData = useAdminWhatsappUIStore((s) => s.setQrData);

  const connectMutation = useConnectFleetInstance();
  const syncMutation = useSyncFleetInstance();

  const [isConnected, setIsConnected] = useState(instance.status === 'CONNECTED');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchQr = useCallback(async () => {
    setErrorMsg(null);
    try {
      const res = await connectMutation.mutateAsync(instance.id);
      if (res.data) {
        setQrData(res.data);
        if (res.data.status === 'CONNECTED') {
          setIsConnected(true);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar QR Code';
      setErrorMsg(msg);
    }
  }, [connectMutation, instance.id, setQrData]);

  // Initial fetch on mount
  useEffect(() => {
    void fetchQr();
  }, [fetchQr]);

  // Polling for connection status every 3 seconds
  useEffect(() => {
    if (isConnected) return;

    const interval = setInterval(async () => {
      try {
        const syncRes = await syncMutation.mutateAsync(instance.id);
        if (syncRes.data?.status === 'CONNECTED') {
          setIsConnected(true);
          clearInterval(interval);
        }
      } catch {
        // Silently retry polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [instance.id, isConnected, syncMutation]);

  // Format base64 src
  const qrImageSrc = qrData?.qrCodeBase64
    ? qrData.qrCodeBase64.startsWith('data:')
      ? qrData.qrCodeBase64
      : `data:image/png;base64,${qrData.qrCodeBase64}`
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card"
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--surface)',
          padding: 24,
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(127, 183, 126, 0.2)',
                color: 'var(--sage)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IconWhatsapp size={20} />
            </div>
            <div>
              <h2 id={titleId} style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                Conectar Aparelho
              </h2>
              <span className="mono" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                {instance.name}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            style={{ padding: 6, borderRadius: '50%' }}
            title="Fechar"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Content Body */}
        {isConnected ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--sage)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px auto',
                boxShadow: '0 0 20px rgba(127, 183, 126, 0.4)',
              }}
            >
              <IconCheck size={36} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Instância Conectada!</h3>
            <p
              style={{
                fontSize: 13,
                color: 'var(--fg-muted)',
                lineHeight: 1.5,
                maxWidth: 360,
                margin: '0 auto',
              }}
            >
              O WhatsApp deste chip foi pareado com sucesso. As mensagens dos pacientes vinculados
              já estão sendo roteadas normalmente.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: 24, padding: '10px 24px' }}
              onClick={onClose}
            >
              Concluir
            </button>
          </div>
        ) : (
          <div>
            <p
              style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 20, lineHeight: 1.5 }}
            >
              1. Abra o WhatsApp no celular do chip.
              <br />
              2. Toque em{' '}
              <strong>Configurações &gt; Aparelhos conectados &gt; Conectar aparelho</strong>.<br />
              3. Aponte a câmera para ler o QR Code abaixo.
            </p>

            {/* QR Code Container */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius)',
                padding: 20,
                display: 'grid',
                placeItems: 'center',
                minHeight: 260,
                border: '1px solid var(--border)',
                margin: '0 auto 20px auto',
                maxWidth: 280,
              }}
            >
              {connectMutation.isPending && !qrImageSrc ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <IconRefresh
                    size={28}
                    className="animate-spin"
                    style={{ color: 'var(--fg-muted)' }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Gerando QR Code...</span>
                </div>
              ) : errorMsg ? (
                <div style={{ textAlign: 'center', padding: 12 }}>
                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--coral)',
                      display: 'block',
                      marginBottom: 12,
                    }}
                  >
                    {errorMsg}
                  </span>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={fetchQr}
                    style={{ fontSize: 12 }}
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : qrImageSrc ? (
                <img
                  src={qrImageSrc}
                  alt="QR Code WhatsApp"
                  style={{ width: 220, height: 220, display: 'block' }}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
                    {qrData?.message || 'Aguardando QR Code...'}
                  </span>
                </div>
              )}
            </div>

            {/* Polling Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 12,
                color: 'var(--fg-muted)',
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--amber)',
                  animation: 'pulse 1.5s infinite',
                }}
              />
              <span>Aguardando leitura do QR Code...</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={fetchQr}
                disabled={connectMutation.isPending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid var(--border)',
                }}
              >
                <IconRefresh
                  size={14}
                  className={connectMutation.isPending ? 'animate-spin' : ''}
                />
                <span>Atualizar QR Code</span>
              </button>
              <button type="button" className="btn-ghost" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
