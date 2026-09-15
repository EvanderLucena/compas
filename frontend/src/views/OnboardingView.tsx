import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { completeOnboarding, getCurrentUser } from '../api/auth';
import { createPatient } from '../api/patients';
import type { AuthUser } from '../types';
import { useNavigate } from 'react-router';

const TOTAL_STEPS = 6;
const STEP_LABELS = [
  'Conheça sua carteira',
  'Configure seu plano',
  'Convide seus pacientes',
  'Escolha seu plano',
  'Dados de pagamento',
  'Pronto',
];

interface PlanOption {
  id: string;
  name: string;
  price: string;
  detail: string;
}

const PLANS: PlanOption[] = [
  { id: 'iniciante', name: 'Iniciante', price: 'R$99,99/mês', detail: 'até 15 pacientes' },
  { id: 'profissional', name: 'Profissional', price: 'R$149,99/mês', detail: 'até 30 pacientes' },
  { id: 'ilimitado', name: 'Ilimitado', price: 'R$199,99/mês', detail: 'sem limite' },
];

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M22 4 12 14.01l-3-3" />
    </svg>
  );
}

function StepDots({ step }: { step: number }) {
  return (
    <div className="onboard-dots">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <span key={i}>
          <div
            className={'onboard-dot ' + (step > i + 1 ? 'done' : step === i + 1 ? 'active' : '')}
          >
            {step > i + 1 ? <CheckIcon size={14} /> : i + 1}
          </div>
          {i < TOTAL_STEPS - 1 && (
            <div className={'onboard-line ' + (step > i + 1 ? 'done' : '')} />
          )}
        </span>
      ))}
    </div>
  );
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatCard(v: string) {
  return v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

interface OnboardPatient {
  name: string;
  whatsapp: string;
}

export function OnboardingView() {
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [payment, setPayment] = useState({ name: '', cpf: '', card: '', expiry: '', cvv: '' });
  const [patients, setPatients] = useState<OnboardPatient[]>([]);
  const [patientForm, setPatientForm] = useState({ name: '', whatsapp: '' });
  const navigate = useNavigate();

  const goHome = async () => {
    try {
      if (patients.length > 0) {
        await Promise.allSettled(
          patients.map((patient) =>
            createPatient({
              name: patient.name,
              whatsapp: patient.whatsapp || undefined,
              objective: 'SAUDE_GERAL',
              terms: true,
            }),
          ),
        );
      }
      try {
        await completeOnboarding();
      } catch {
        // Non-blocking: proceed even if server completeOnboarding fails
      }

      try {
        const user = await getCurrentUser();
        useAuthStore.setState({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as AuthUser['role'],
            onboardingCompleted: true,
          },
        });
      } catch {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.setState({
            user: {
              ...currentUser,
              onboardingCompleted: true,
            },
          });
        }
      }
      navigate('/home');
    } catch {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.setState({
          user: {
            ...currentUser,
            onboardingCompleted: true,
          },
        });
      }
      navigate('/home');
    }
  };

  const set = (k: string, v: string) => setPayment((p) => ({ ...p, [k]: v }));

  const paymentValid =
    payment.name.trim().length >= 3 &&
    payment.cpf.replace(/\D/g, '').length === 11 &&
    payment.card.replace(/\D/g, '').length === 16 &&
    payment.expiry.replace(/\D/g, '').length === 4 &&
    payment.cvv.length === 3;

  const addPatient = () => {
    if (!patientForm.name.trim()) return;
    setPatients((prev) => [
      ...prev,
      { name: patientForm.name.trim(), whatsapp: patientForm.whatsapp.trim() },
    ]);
    setPatientForm({ name: '', whatsapp: '' });
  };

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan);

  return (
    <div className="onboard-page">
      <div className="onboard-header">
        <div className="auth-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2c0 6-6 7-6 13a6 6 0 0 0 12 0c0-6-6-7-6-13Z"
              style={{ stroke: 'var(--lime)' }}
              strokeWidth="1.6"
            />
            <circle cx="12" cy="14" r="1.4" style={{ fill: 'var(--lime)' }} />
          </svg>
          <span className="auth-brand-name">
            Nutri<span>AI</span>
          </span>
        </div>
        {step < 6 && (
          <button className="btn btn-ghost onboard-skip" onClick={goHome}>
            Pular por enquanto
          </button>
        )}
      </div>

      <div className="onboard-body">
        <StepDots step={step} />
        <div className="onboard-step-label">{STEP_LABELS[step - 1]}</div>

        {step === 1 && (
          <div className="onboard-card" style={{ textAlign: 'left' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="onboard-card-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h2>{patients.length === 0 ? 'Adicione seu primeiro paciente' : 'Ótimo começo!'}</h2>
              <p>
                {patients.length === 0
                  ? 'Só preciso do nome e WhatsApp. Você pode adicionar mais depois pelo painel.'
                  : `Você já tem ${patients.length} paciente${patients.length > 1 ? 's' : ''}. Pode continuar adicionando ou ir pro próximo passo.`}
              </p>
            </div>

            {patients.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  {patients.length} paciente{patients.length > 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {patients.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        background: 'var(--surface-2)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: 'var(--sage)',
                          color: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 10,
                          flexShrink: 0,
                        }}
                      >
                        <CheckIcon size={10} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                        {p.whatsapp && (
                          <div
                            className="mono"
                            style={{ fontSize: 10.5, color: 'var(--fg-subtle)' }}
                          >
                            {p.whatsapp}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setPatients((prev) => prev.filter((_, j) => j !== i))}
                        style={{
                          color: 'var(--fg-subtle)',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 2,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--coral)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-subtle)')}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: '14px 16px',
                border: '1px dashed var(--border-2)',
                borderRadius: 'var(--radius)',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px auto',
                  gap: 8,
                  alignItems: 'end',
                }}
              >
                <div className="auth-field" style={{ gap: 4 }}>
                  <label className="auth-label">NOME</label>
                  <input
                    className="auth-input"
                    placeholder="Nome do paciente"
                    value={patientForm.name}
                    onChange={(e) => setPatientForm((p) => ({ ...p, name: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addPatient()}
                  />
                </div>
                <div className="auth-field" style={{ gap: 4 }}>
                  <label className="auth-label">WHATSAPP</label>
                  <input
                    className="auth-input"
                    placeholder="(11) 99999-0000"
                    value={patientForm.whatsapp}
                    onChange={(e) => setPatientForm((p) => ({ ...p, whatsapp: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addPatient()}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ padding: '9px 12px', flexShrink: 0 }}
                  disabled={!patientForm.name.trim()}
                  onClick={addPatient}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>
                Adicionar depois →
              </button>
              {patients.length > 0 && (
                <button className="btn btn-primary" onClick={() => setStep(2)}>
                  Continuar →
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboard-card">
            <div className="onboard-card-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
                <path d="M10 9H8" />
              </svg>
            </div>
            <h2>Configure seu primeiro plano</h2>
            <p>
              Monte um plano alimentar simples. A IA vai usar esse plano como referência pra
              orientar o paciente no WhatsApp.
            </p>
            <div className="onboard-plan-preview">
              <div className="onboard-plan-row">
                <span className="onboard-plan-meal">Café da manhã</span>
                <span className="onboard-plan-items">3 itens</span>
                <span className="onboard-plan-kcal">420 kcal</span>
              </div>
              <div className="onboard-plan-row">
                <span className="onboard-plan-meal">Lanche da manhã</span>
                <span className="onboard-plan-items">1 item</span>
                <span className="onboard-plan-kcal">150 kcal</span>
              </div>
              <div className="onboard-plan-row">
                <span className="onboard-plan-meal">Almoço</span>
                <span className="onboard-plan-items">4 itens</span>
                <span className="onboard-plan-kcal">680 kcal</span>
              </div>
              <div className="onboard-plan-row">
                <span className="onboard-plan-meal">Lanche da tarde</span>
                <span className="onboard-plan-items">1 item</span>
                <span className="onboard-plan-kcal">130 kcal</span>
              </div>
              <div className="onboard-plan-row">
                <span className="onboard-plan-meal">Jantar</span>
                <span className="onboard-plan-items">3 itens</span>
                <span className="onboard-plan-kcal">550 kcal</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setStep(3)}>
              Configurar plano →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="onboard-card">
            <div className="onboard-card-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
              </svg>
            </div>
            <h2>Convide seus pacientes</h2>
            <p>
              Mande o link personalizado pra cada paciente. Quando eles mandarem a primeira mensagem
              no WhatsApp, a IA se apresenta e começa o acompanhamento.
            </p>
            <div className="onboard-invite-example">
              <div className="onboard-invite-link">
                <span className="onboard-invite-prefix">wa.me/</span>
                <span className="onboard-invite-number">5511999999999</span>
                <span className="onboard-invite-text">?text=Olá, sou paciente da Dra. Helena</span>
              </div>
              <button className="btn btn-secondary" style={{ marginTop: 12 }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copiar link
              </button>
            </div>
            <div className="onboard-privacy-note">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              </svg>
              <span>
                Seus pacientes saberão que as conversas são privadas. Só os dados de alimentação são
                compartilhados com você.
              </span>
            </div>
            <button className="btn btn-primary" onClick={() => setStep(4)}>
              Enviar convites →
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="onboard-card">
            <div className="onboard-card-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h2>Escolha seu plano</h2>
            <p>
              30 dias grátis com todas as funcionalidades. Cancele quando quiser — sem cobrança se
              cancelar dentro do trial.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                marginBottom: 24,
              }}
            >
              {PLANS.map((p) => {
                const isSel = selectedPlan === p.id;
                const isPopular = p.id === 'profissional';
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    style={{
                      padding: 16,
                      border: isSel
                        ? '2px solid var(--lime-dim)'
                        : isPopular
                          ? '1px solid var(--lime-dim)'
                          : '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: isSel ? 'rgba(212,255,79,0.05)' : 'transparent',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    {isPopular && (
                      <div
                        className="mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--lime-dim)',
                          marginBottom: 2,
                        }}
                      >
                        MAIS POPULAR
                      </div>
                    )}
                    <div
                      className="mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--fg-subtle)',
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      className="serif"
                      style={{ fontSize: 24, fontWeight: 600, margin: '4px 0' }}
                    >
                      {p.price.replace('/mês', '')}
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: 'var(--font-ui)',
                          fontWeight: 400,
                          color: 'var(--fg-muted)',
                        }}
                      >
                        /mês
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{p.detail}</div>
                    {isSel && (
                      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'var(--lime-dim)',
                            color: 'var(--ink)',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <CheckIcon size={11} />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              className="btn btn-primary"
              disabled={!selectedPlan}
              onClick={() => setStep(5)}
              style={{ opacity: selectedPlan ? 1 : 0.5 }}
            >
              Continuar →
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="onboard-card" style={{ textAlign: 'left' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="onboard-card-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <h2>Dados de pagamento</h2>
              <p>Seu cartão só será cobrado após 30 dias. Cancele antes e nada será cobrado.</p>
            </div>

            {selectedPlanData && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius)',
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--fg-subtle)',
                    }}
                  >
                    PLANO SELECIONADO
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>
                    {selectedPlanData.name} · {selectedPlanData.price}
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  onClick={() => setStep(4)}
                >
                  Trocar
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="auth-field">
                <label className="auth-label">NOME NO CARTÃO</label>
                <input
                  className="auth-input"
                  placeholder="Nome como aparece no cartão"
                  value={payment.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">CPF</label>
                <input
                  className="auth-input"
                  placeholder="000.000.000-00"
                  value={payment.cpf}
                  onChange={(e) => set('cpf', formatCPF(e.target.value))}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">NÚMERO DO CARTÃO</label>
                <input
                  className="auth-input"
                  placeholder="0000 0000 0000 0000"
                  value={payment.card}
                  onChange={(e) => set('card', formatCard(e.target.value))}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="auth-field">
                  <label className="auth-label">VALIDADE</label>
                  <input
                    className="auth-input"
                    placeholder="MM/AA"
                    value={payment.expiry}
                    onChange={(e) => set('expiry', formatExpiry(e.target.value))}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">CVV</label>
                  <input
                    className="auth-input"
                    placeholder="000"
                    value={payment.cvv}
                    onChange={(e) => set('cvv', e.target.value.replace(/\D/g, '').slice(0, 3))}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>
            </div>

            <div className="onboard-privacy-note" style={{ marginTop: 16 }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span>
                Seus dados de pagamento são procesados com segurança. Não armazenamos o número do
                cartão.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setStep(4)}>
                ← Voltar
              </button>
              <button
                className="btn btn-primary"
                disabled={!paymentValid}
                onClick={() => setStep(6)}
                style={{ opacity: paymentValid ? 1 : 0.5 }}
              >
                Ativar trial de 30 dias
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="onboard-card onboard-card-success">
            <div className="onboard-card-icon onboard-card-icon-success">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4 12 14.01l-3-3" />
              </svg>
            </div>
            <h2>Pronto!</h2>
            <p>
              A IA já está conversando com seus pacientes. Você acompanha tudo pelo painel — dados
              estruturados, adesão, tendências.
            </p>
            <div className="onboard-success-checklist">
              <div className="onboard-check-item done">
                <CheckIcon size={16} />
                <span>
                  {patients.length > 0
                    ? `${patients.length} paciente${patients.length > 1 ? 's' : ''} cadastrado${patients.length > 1 ? 's' : ''}`
                    : 'Pacientes — adicionar depois pelo painel'}
                </span>
              </div>
              <div className="onboard-check-item done">
                <CheckIcon size={16} />
                <span>Plano alimentar configurado</span>
              </div>
              <div className="onboard-check-item done">
                <CheckIcon size={16} />
                <span>Convites enviados</span>
              </div>
              <div className="onboard-check-item done">
                <CheckIcon size={16} />
                <span>Trial de 30 dias iniciado</span>
              </div>
              <div className="onboard-check-item done">
                <CheckIcon size={16} />
                <span>
                  {selectedPlanData ? `Plano ${selectedPlanData.name} ativado` : 'Plano ativado'}
                </span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={goHome}>
              Ir pro painel →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
