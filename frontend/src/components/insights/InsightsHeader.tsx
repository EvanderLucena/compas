export function InsightsHeader({ whatsappConnected }: { whatsappConnected: boolean }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>Inteligência Clínica · Acompanhamento WhatsApp</span>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: whatsappConnected ? 'var(--sage)' : 'var(--amber)',
            display: 'inline-block',
          }}
          title={whatsappConnected ? 'WhatsApp Conectado' : 'Aguardando mensagens'}
        />
      </div>
      <h1
        className="serif"
        style={{ fontSize: 36, margin: '6px 0 8px', fontWeight: 400, letterSpacing: '-0.02em' }}
      >
        Radar Clínico
      </h1>
      <div style={{ fontSize: 14, color: 'var(--fg-muted)', maxWidth: 780, lineHeight: 1.55 }}>
        Acompanhe o engajamento e a adesão dos pacientes às refeições do plano alimentar. Priorize
        quem precisa de acolhimento ou ajustes no plano em tempo real.
      </div>
    </div>
  );
}
