import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { completeOnboarding, getCurrentUser } from '../api/auth';
import type { AuthUser } from '../types';
import { useNavigate, Link } from 'react-router';
import { IconCompas } from '../components/ui/CompasLogo';
import { useToastStore } from '../stores/toastStore';
import { usePatientUIStore, resolveMutationErrorMessage } from '../stores/patientStore';

const TOTAL_STEPS = 5;
const STEP_LABELS = [
  'WhatsApp Inteligente',
  'Gestão da Carteira',
  'Planos & Porções',
  'Evolução Biométrica',
  'Pronto para Começar',
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
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function StepDots({ step }: { step: number }) {
  return (
    <div className="onboard-dots">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
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

function Step1WhatsApp({ onNext }: { onNext: () => void }) {
  return (
    <div className="onboard-card onboard-card-tour">
      <div className="onboard-card-icon">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h2>O WhatsApp é a interface do seu paciente</h2>
      <p>
        Zero aplicativos desconhecidos ou planilhas difíceis. O paciente envia relatos no WhatsApp
        como conversa comum, e a IA extrai alimentos e macronutrientes com total privacidade.
      </p>

      <div className="onboard-tour-preview">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span
            className="mono"
            style={{ fontSize: 10, color: 'var(--fg-subtle)', textTransform: 'uppercase' }}
          >
            WhatsApp · Compas
          </span>
          <span className="chip ai" style={{ fontSize: 9.5, padding: '1px 6px' }}>
            Privacidade LGPD
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              alignSelf: 'flex-end',
              background: 'rgba(127,183,126,0.15)',
              border: '1px solid rgba(127,183,126,0.3)',
              padding: '8px 12px',
              borderRadius: '8px 8px 0 8px',
              maxWidth: '85%',
              fontSize: 12.5,
            }}
          >
            Almocei agora: 150g de frango grelhado com 4 colheres de arroz e salada mista 🥗
          </div>
          <div
            style={{
              alignSelf: 'flex-start',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '8px 12px',
              borderRadius: '8px 8px 8px 0',
              maxWidth: '85%',
              fontSize: 12.5,
            }}
          >
            Perfeito, Helena! Registrei seu almoço. Bateu 38g de proteína dentro da meta do seu
            plano 💪
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            padding: '10px 12px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span className="chip ai" style={{ fontSize: 9, padding: '1px 5px' }}>
              DADO ESTRUTURADO NO PAINEL
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>
            Frango 150g · Arroz branco 120g · Salada 80g
          </div>
          <div className="onboard-macro-pills">
            <div className="onboard-macro-pill">
              <span className="onboard-macro-pill-val">520</span>
              <span className="onboard-macro-pill-label">kcal</span>
            </div>
            <div className="onboard-macro-pill">
              <span className="onboard-macro-pill-val">38g</span>
              <span className="onboard-macro-pill-label">prot</span>
            </div>
            <div className="onboard-macro-pill">
              <span className="onboard-macro-pill-val">58g</span>
              <span className="onboard-macro-pill-label">carb</span>
            </div>
            <div className="onboard-macro-pill">
              <span className="onboard-macro-pill-val">14g</span>
              <span className="onboard-macro-pill-label">gord</span>
            </div>
          </div>
        </div>
      </div>

      <div className="onboard-tour-nav">
        <span />
        <button
          type="button"
          data-testid="onboarding-next"
          className="btn btn-primary"
          onClick={onNext}
        >
          Próximo passo →
        </button>
      </div>
    </div>
  );
}

function Step2Patients({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="onboard-card onboard-card-tour">
      <div className="onboard-card-icon">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h2>Gestão inteligente da sua carteira</h2>
      <p>
        Veja de relance a saúde de todos os seus pacientes. Alertas automáticos mostram quem está em
        dia, quem precisa de atenção e quem está sob risco de abandono.
      </p>

      <div className="onboard-tour-preview">
        <div className="onboard-patient-sample">
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Ana Clara Silveira</div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-subtle)' }}>
              Hipertrofia · 6 refeições/dia
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
              94%
            </span>
            <span className="chip ontrack" style={{ fontSize: 10, padding: '2px 7px' }}>
              EM DIA
            </span>
          </div>
        </div>

        <div className="onboard-patient-sample">
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Carlos Eduardo Mendes</div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-subtle)' }}>
              Emagrecimento · 4 refeições/dia
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
              68%
            </span>
            <span className="chip warning" style={{ fontSize: 10, padding: '2px 7px' }}>
              ATENÇÃO
            </span>
          </div>
        </div>

        <div className="onboard-patient-sample">
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Mariana Souza</div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-subtle)' }}>
              Saúde Geral · 3 dias sem relato
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
              32%
            </span>
            <span className="chip danger" style={{ fontSize: 10, padding: '2px 7px' }}>
              RISCO
            </span>
          </div>
        </div>
      </div>

      <div className="onboard-tour-nav">
        <button
          type="button"
          data-testid="onboarding-prev"
          className="btn btn-ghost"
          onClick={onPrev}
        >
          ← Voltar
        </button>
        <button
          type="button"
          data-testid="onboarding-next"
          className="btn btn-primary"
          onClick={onNext}
        >
          Próximo passo →
        </button>
      </div>
    </div>
  );
}

function Step3Plan({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="onboard-card onboard-card-tour">
      <div className="onboard-card-icon">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
      </div>
      <h2>Planos com alimentos porcionados</h2>
      <p>
        Cadastre porções prontas no catálogo ("Frango 150g", "Arroz branco 120g") uma única vez.
        Monte planos com opções de substituição sem recalcular macros do zero.
      </p>

      <div className="onboard-tour-preview">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>Almoço · Opção Principal</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
            Meta: 550 kcal
          </span>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          <div className="onboard-plan-food-item">
            <span>Frango grelhado (150g)</span>
            <span className="mono" style={{ color: 'var(--fg-muted)' }}>
              248 kcal · 46g P
            </span>
          </div>
          <div className="onboard-plan-food-item">
            <span>Arroz branco cozido (120g)</span>
            <span className="mono" style={{ color: 'var(--fg-muted)' }}>
              156 kcal · 3g P
            </span>
          </div>
          <div className="onboard-plan-food-item">
            <span>Feijão carioca (100g)</span>
            <span className="mono" style={{ color: 'var(--fg-muted)' }}>
              76 kcal · 5g P
            </span>
          </div>
        </div>

        <div
          style={{ marginTop: 10, fontSize: 11.5, color: 'var(--fg-subtle)', fontStyle: 'italic' }}
        >
          💡 Você pode adicionar quantas opções de substituição quiser por refeição.
        </div>
      </div>

      <div className="onboard-tour-nav">
        <button
          type="button"
          data-testid="onboarding-prev"
          className="btn btn-ghost"
          onClick={onPrev}
        >
          ← Voltar
        </button>
        <button
          type="button"
          data-testid="onboarding-next"
          className="btn btn-primary"
          onClick={onNext}
        >
          Próximo passo →
        </button>
      </div>
    </div>
  );
}

function Step4Biometry({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="onboard-card onboard-card-tour">
      <div className="onboard-card-icon">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </div>
      <h2>Acompanhamento biométrico e evolução</h2>
      <p>
        A cada consulta presencial ou retorno online, registre peso, bioimpedância, dobras cutâneas
        e perimetria. O gráfico de evolução traça deltas e metas alcançadas.
      </p>

      <div className="onboard-tour-preview">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>Evolução de Peso · Últimos 3 meses</span>
          <span className="chip ontrack" style={{ fontSize: 10, padding: '1px 6px' }}>
            -5,1 kg
          </span>
        </div>

        <div
          style={{
            height: 90,
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <svg viewBox="0 0 260 50" style={{ width: '100%', height: 45 }}>
            <polyline
              points="0,42 50,38 100,34 150,26 200,18 260,10"
              fill="none"
              stroke="var(--sage)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="260" cy="10" r="4" fill="var(--sage)" />
          </svg>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg-subtle)',
            }}
          >
            <span>Outubro: 74,2 kg</span>
            <span style={{ color: 'var(--sage)', fontWeight: 600 }}>Hoje: 69,1 kg</span>
          </div>
        </div>
      </div>

      <div className="onboard-tour-nav">
        <button
          type="button"
          data-testid="onboarding-prev"
          className="btn btn-ghost"
          onClick={onPrev}
        >
          ← Voltar
        </button>
        <button
          type="button"
          data-testid="onboarding-next"
          className="btn btn-primary"
          onClick={onNext}
        >
          Próximo passo →
        </button>
      </div>
    </div>
  );
}

function Step5Ready({
  isFinishing,
  onFinish,
}: {
  isFinishing: boolean;
  onFinish: (dest: 'patients' | 'home') => void;
}) {
  return (
    <div className="onboard-card onboard-card-tour onboard-card-success">
      <div className="onboard-card-icon onboard-card-icon-success">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="M22 4 12 14.01l-3-3" />
        </svg>
      </div>
      <h2>Tudo pronto para começar!</h2>
      <p>
        Seu ambiente clínico está 100% configurado. Escolha por onde deseja dar seu primeiro passo:
      </p>

      <div className="onboard-tour-preview" style={{ background: 'var(--surface)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ color: 'var(--sage)' }}>
              <CheckIcon size={16} />
            </span>
            <span>WhatsApp como canal único para o paciente</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ color: 'var(--sage)' }}>
              <CheckIcon size={16} />
            </span>
            <span>Privacidade garantida conforme LGPD</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ color: 'var(--sage)' }}>
              <CheckIcon size={16} />
            </span>
            <span>Catálogo de alimentos e planos personalizados</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ color: 'var(--sage)' }}>
              <CheckIcon size={16} />
            </span>
            <span>Acompanhamento biométrico e adesão em tempo real</span>
          </div>
        </div>
      </div>

      <div className="onboard-tour-final-actions">
        <button
          type="button"
          data-testid="onboarding-create-patient"
          className="btn btn-primary"
          onClick={() => onFinish('patients')}
          disabled={isFinishing}
          style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600 }}
        >
          {isFinishing ? 'Iniciando...' : 'Cadastrar meu primeiro paciente →'}
        </button>
        <button
          type="button"
          data-testid="onboarding-go-home"
          className="btn btn-secondary"
          onClick={() => onFinish('home')}
          disabled={isFinishing}
          style={{ padding: '10px 20px', fontSize: 13.5 }}
        >
          Explorar o painel completo
        </button>
      </div>
    </div>
  );
}

export function OnboardingView() {
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const navigate = useNavigate();

  const finishTutorial = async (destination: 'patients' | 'home') => {
    setIsFinishing(true);
    try {
      await completeOnboarding();
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
      if (destination === 'patients') {
        usePatientUIStore.getState().setNewPatientModalOpen(true);
        navigate('/patients');
      } else {
        navigate('/home');
      }
    } catch (err) {
      useToastStore
        .getState()
        .showError(resolveMutationErrorMessage(err, 'Erro ao concluir tutorial — tente novamente'));
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="onboard-page">
      <header className="onboard-header">
        <Link to="/" className="auth-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <IconCompas size={22} color="var(--lime-dim)" />
          <span className="auth-brand-name">
            compas<span style={{ color: 'var(--lime-dim)' }}>.</span>
          </span>
        </Link>
        <button
          type="button"
          data-testid="onboarding-skip"
          className="btn btn-ghost onboard-skip"
          onClick={() => finishTutorial('home')}
          disabled={isFinishing}
        >
          Pular tutorial →
        </button>
      </header>

      <main className="onboard-body">
        <StepDots step={step} />
        <div className="onboard-step-label">
          {STEP_LABELS[step - 1]} · Passo {step} de {TOTAL_STEPS}
        </div>

        {step === 1 && <Step1WhatsApp onNext={() => setStep(2)} />}
        {step === 2 && <Step2Patients onPrev={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <Step3Plan onPrev={() => setStep(2)} onNext={() => setStep(4)} />}
        {step === 4 && <Step4Biometry onPrev={() => setStep(3)} onNext={() => setStep(5)} />}
        {step === 5 && <Step5Ready isFinishing={isFinishing} onFinish={finishTutorial} />}
      </main>
    </div>
  );
}
