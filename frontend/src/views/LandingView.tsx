import { useState } from 'react';
import { Link } from 'react-router';
import { IconCompas } from '../components/ui/CompasLogo';

const FEATURES = [
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
      </svg>
    ),
    title: 'WhatsApp como interface',
    desc: 'Seu paciente não instala nada. A IA é a interface — conversa natural, extração automática.',
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      </svg>
    ),
    title: 'Privacidade por design',
    desc: 'Você nunca vê a conversa. Só dados estruturados de alimentação. Pacientes são mais honestos sabendo disso.',
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
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
    ),
    title: 'Planos alimentares',
    desc: 'Monte planos por refeição com opções e substituições. Macros calculados automaticamente. A IA usa como referência.',
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
      </svg>
    ),
    title: 'Alimentos porcionados',
    desc: 'Cadastre alimentos já porcionados uma vez. Reutilize em qualquer plano. "Frango grelhado 150g" vira um clique.',
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M3 3v18h18" />
        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
      </svg>
    ),
    title: 'Dashboard em tempo real',
    desc: 'Acompanhe adesão, macros e tendências de cada paciente. Informação, não achismo.',
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: 'Timeline biométrica',
    desc: 'Peso, dobras, perimetria — cada consulta vira um registro na timeline. Gráficos mostram a evolução real do paciente.',
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Gestão de pacientes',
    desc: 'Status de adesão, filtros, busca. Veja quem está on-track, quem precisa de atenção — em segundos.',
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
    title: 'Inteligência agregada',
    desc: 'Visão da sua carteira toda. Quem está aderindo, quem está sumindo, tendências e alertas automáticos.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'O paciente precisa instalar algo?',
    a: 'Não. O paciente só precisa do WhatsApp. A IA é a interface — zero onboarding, zero app, zero login.',
  },
  {
    q: 'Eu consigo ler o que o paciente manda?',
    a: 'Não. Você vê apenas os dados estruturados extraídos pela IA: refeições, quantidades e horários. A conversa é privada.',
  },
  {
    q: 'E se a IA extrair algo errado?',
    a: 'Você pode editar qualquer registro extraído no painel. A IA aprende com as correções.',
  },
  {
    q: 'Como funciona o trial?',
    a: '30 dias grátis com todas as funcionalidades. Você cadastra o cartão, mas só é cobrado após o período. Cancele quando quiser.',
  },
  {
    q: 'Funciona com qualquer plano alimentar?',
    a: 'Sim. Você monta o plano no painel e a IA usa como referência pra orientar o paciente no WhatsApp.',
  },
  {
    q: 'Meus dados ficam no Brasil?',
    a: 'Sim. Servidor em São Paulo, dados criptografados, conforme LGPD.',
  },
];

function BrandLogo() {
  return (
    <Link to="/" className="landing-logo" aria-label="Compas - Início">
      <IconCompas size={22} />
      <span>
        compas<span style={{ color: 'var(--lime-dim)' }}>.</span>
      </span>
    </Link>
  );
}

function ChatMockup() {
  return (
    <div className="landing-mockup landing-mockup-chat">
      <div className="mockup-chat-header">
        <div className="mockup-chat-dot" />
        <div>
          <div className="mockup-chat-name">Compas · Ana</div>
          <div className="mockup-chat-status">online</div>
        </div>
      </div>
      <div className="mockup-chat-body">
        <div className="mockup-msg mockup-msg-patient">
          <div className="mockup-bubble">
            Anoiteceu aqui, tô morrendo de fome… vou comer um Xtudo hoje 😭
          </div>
          <span className="mockup-time">22:47</span>
        </div>
        <div className="mockup-msg mockup-msg-ai">
          <div className="mockup-bubble">
            Entendo demais! 😅 Olha, não precisa abrir mão — vamos só amenizar o impacto: bebe
            bastante água junto, tira o molho verde (economiza umas calorias boas), e se puder,
            deixa metade da batata frita pro almoço de amanhã. No jantar do plano tá previsto frango
            grelhado — se trocar pelo Xtudo, pede sem queijo extra e sem maionese. Assim você
            aproveita sem extrapolar tanto 🤝
          </div>
          <span className="mockup-time">22:47</span>
        </div>
        <div className="mockup-msg mockup-msg-patient">
          <div className="mockup-bubble">Oxta, vou pedir sem molho e dividir a batata 🙏</div>
          <span className="mockup-time">22:48</span>
        </div>
        <div className="mockup-msg mockup-msg-ai">
          <div className="mockup-bubble">
            Perfeito! Anotei: Xtudo (sem molho, batata dividida) no jantar. Amanhã podemos compensar
            com um café da manhã mais leve. Boa noite! 😊
          </div>
          <span className="mockup-time">22:48</span>
        </div>
      </div>
    </div>
  );
}

function ExtractionMockup() {
  return (
    <div className="landing-mockup landing-mockup-extraction">
      <div className="mockup-ext-header">
        <span className="mockup-ext-dot" />
        <span>Timeline · Hoje</span>
        <span className="mockup-ext-badge">IA</span>
      </div>
      <div className="mockup-tl-row">
        <div className="mockup-tl-time">
          <span className="mockup-tl-hour">22:47</span>
          <span className="mockup-tl-meal">Jantar</span>
        </div>
        <div className="mockup-tl-col">
          <div className="mockup-tl-dot" />
          <div className="mockup-tl-line" />
        </div>
        <div className="mockup-tl-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Registro</span>
            <span className="chip ai" style={{ padding: '1px 5px', fontSize: 9 }}>
              <span className="d" />
              EXTRAÍDO IA
            </span>
          </div>
          <div
            className="mono"
            style={{
              fontSize: 9.5,
              color: 'var(--fg-subtle)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Xtudo · redução de danos orientada
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <li style={{ fontSize: 12.5, color: 'var(--fg)', display: 'flex', gap: 6 }}>
              <span style={{ color: 'var(--fg-subtle)' }}>·</span>Xtudo (1 unidade)
            </li>
            <li style={{ fontSize: 12.5, color: 'var(--fg)', display: 'flex', gap: 6 }}>
              <span style={{ color: 'var(--fg-subtle)' }}>·</span>Sem molho verde
            </li>
            <li style={{ fontSize: 12.5, color: 'var(--fg)', display: 'flex', gap: 6 }}>
              <span style={{ color: 'var(--fg-subtle)' }}>·</span>Batata frita (meia porção)
            </li>
          </ul>
        </div>
        <div className="mockup-tl-macros">
          <div className="mockup-tl-macro">
            <span className="mockup-tl-macro-l">kcal</span>
            <span>780</span>
          </div>
          <div className="mockup-tl-macro">
            <span className="mockup-tl-macro-l">prot</span>
            <span>42g</span>
          </div>
          <div className="mockup-tl-macro">
            <span className="mockup-tl-macro-l">carb</span>
            <span>65g</span>
          </div>
          <div className="mockup-tl-macro">
            <span className="mockup-tl-macro-l">gord</span>
            <span>38g</span>
          </div>
        </div>
      </div>
      <div className="mockup-tl-row">
        <div className="mockup-tl-time">
          <span className="mockup-tl-hour">12:30</span>
          <span className="mockup-tl-meal">Almoço</span>
        </div>
        <div className="mockup-tl-col">
          <div className="mockup-tl-dot" />
        </div>
        <div className="mockup-tl-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Registro</span>
            <span className="chip ai" style={{ padding: '1px 5px', fontSize: 9 }}>
              <span className="d" />
              EXTRAÍDO IA
            </span>
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <li style={{ fontSize: 12.5, color: 'var(--fg)', display: 'flex', gap: 6 }}>
              <span style={{ color: 'var(--fg-subtle)' }}>·</span>Frango grelhado 150g
            </li>
            <li style={{ fontSize: 12.5, color: 'var(--fg)', display: 'flex', gap: 6 }}>
              <span style={{ color: 'var(--fg-subtle)' }}>·</span>Arroz branco 120g
            </li>
            <li style={{ fontSize: 12.5, color: 'var(--fg)', display: 'flex', gap: 6 }}>
              <span style={{ color: 'var(--fg-subtle)' }}>·</span>Salada mista 80g
            </li>
          </ul>
        </div>
        <div className="mockup-tl-macros">
          <div className="mockup-tl-macro">
            <span className="mockup-tl-macro-l">kcal</span>
            <span>520</span>
          </div>
          <div className="mockup-tl-macro">
            <span className="mockup-tl-macro-l">prot</span>
            <span>38g</span>
          </div>
          <div className="mockup-tl-macro">
            <span className="mockup-tl-macro-l">carb</span>
            <span>58g</span>
          </div>
          <div className="mockup-tl-macro">
            <span className="mockup-tl-macro-l">gord</span>
            <span>14g</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="landing-mockup landing-mockup-dashboard">
      <div className="mockup-dash-topbar">
        <div className="mockup-dash-dot" />
        <span>Ana · Hoje</span>
        <span className="mockup-dash-badge-warning">atenção</span>
      </div>
      <div className="mockup-dash-metrics">
        <div className="mockup-metric">
          <span className="mockup-metric-val">87%</span>
          <span className="mockup-metric-label">Adesão semanal</span>
        </div>
        <div className="mockup-metric">
          <span className="mockup-metric-val">1.740</span>
          <span className="mockup-metric-label">kcal hoje</span>
        </div>
        <div className="mockup-metric">
          <span className="mockup-metric-val">88g</span>
          <span className="mockup-metric-label">proteína</span>
        </div>
      </div>
      <div className="mockup-dash-bar">
        <div className="mockup-dash-bar-fill" style={{ width: '87%' }} />
        <div className="mockup-dash-bar-label">
          1.740 / 2.000 kcal · 260 kcal acima do plano do jantar
        </div>
      </div>
    </div>
  );
}

function FoodsMockup() {
  return (
    <div className="landing-mockup landing-mockup-foods">
      <div className="mockup-foods-header">
        <span className="mockup-foods-search">Buscar alimento ou porção…</span>
      </div>
      <div className="mockup-foods-row mockup-foods-row-head">
        <span>Alimento</span>
        <span>Porção</span>
        <span>Kcal</span>
        <span>P</span>
        <span>C</span>
        <span>G</span>
      </div>
      <div className="mockup-foods-row">
        <span className="mockup-foods-name">Frango grelhado</span>
        <span>150g</span>
        <span>248</span>
        <span>46g</span>
        <span>0g</span>
        <span>5.5g</span>
      </div>
      <div className="mockup-foods-row">
        <span className="mockup-foods-name">Arroz branco</span>
        <span>120g</span>
        <span>156</span>
        <span>3g</span>
        <span>34g</span>
        <span>0.3g</span>
      </div>
      <div className="mockup-foods-row">
        <span className="mockup-foods-name">Batata doce cozida</span>
        <span>200g</span>
        <span>180</span>
        <span>2g</span>
        <span>41g</span>
        <span>0g</span>
      </div>
      <div className="mockup-foods-row">
        <span className="mockup-foods-name">Ovo cozido</span>
        <span>2 un.</span>
        <span>140</span>
        <span>12g</span>
        <span>1g</span>
        <span>10g</span>
      </div>
    </div>
  );
}

function BioMockup() {
  return (
    <div className="landing-mockup landing-mockup-bio">
      <div className="mockup-bio-header">
        <span>Ana · Evolução</span>
        <span className="mockup-bio-range">Últimos 6 meses</span>
      </div>
      <div className="mockup-bio-chart">
        <div className="mockup-bio-y">
          <span>74</span>
          <span>72</span>
          <span>70</span>
          <span>68</span>
        </div>
        <div className="mockup-bio-area">
          <svg viewBox="0 0 300 100" className="mockup-bio-svg">
            <polyline
              points="0,80 50,72 100,65 150,55 200,42 250,30 300,20"
              fill="none"
              stroke="var(--sage)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="0,80 50,72 100,65 150,55 200,42 250,30 300,20 300,100 0,100"
              fill="var(--sage)"
              opacity="0.08"
            />
          </svg>
        </div>
        <div className="mockup-bio-x">
          <span>Out</span>
          <span>Nov</span>
          <span>Dez</span>
          <span>Jan</span>
          <span>Fev</span>
          <span>Mar</span>
        </div>
      </div>
      <div className="mockup-bio-legend">
        <div className="mockup-bio-legend-item">
          <span className="mockup-bio-dot" style={{ background: 'var(--sage)' }} />
          <span>Peso corporal</span>
          <strong>74,2 → 69,1 kg</strong>
          <span className="mockup-bio-delta mockup-bio-delta-good">-5,1 kg</span>
        </div>
        <div className="mockup-bio-legend-item">
          <span className="mockup-bio-dot" style={{ background: 'var(--lime-dim)' }} />
          <span>% gordura</span>
          <strong>28,4 → 24,1%</strong>
          <span className="mockup-bio-delta mockup-bio-delta-good">-4,3 pp</span>
        </div>
      </div>
    </div>
  );
}

export function LandingView() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <BrandLogo />
          <div className="landing-nav-links">
            <a href="#como-funciona">Como funciona</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#pricing">Planos</a>
            <a href="#faq">FAQ</a>
            <Link to="/login" className="btn btn-ghost">
              Entrar
            </Link>
            <Link to="/signup" className="btn btn-primary">
              Começar grátis
            </Link>
          </div>
          <button
            type="button"
            className="landing-mobile-toggle"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
            <span>Menu</span>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="landing-mobile-menu">
            <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)}>
              Como funciona
            </a>
            <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)}>
              Funcionalidades
            </a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>
              Planos
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </a>
            <div className="landing-mobile-menu-ctas">
              <Link
                to="/login"
                className="btn btn-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Entrar
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Começar grátis
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-eyebrow">Inteligência artificial para nutrição</div>
          <h1 className="landing-hero-title">
            Seus pacientes reportam.
            <br />
            A IA extrai.
            <br />
            <span style={{ color: 'var(--lime-dim)' }}>Você decide.</span>
          </h1>
          <p className="landing-hero-sub">
            O paciente conversa com a IA pelo WhatsApp. Você vê apenas os dados estruturados —
            refeições, quantidades, horários. Nunca a conversa original.
          </p>
          <div className="landing-hero-cta">
            <Link to="/signup" className="btn btn-primary landing-cta-btn">
              Testar 30 dias grátis
            </Link>
            <span className="landing-hero-hint">30 dias grátis · Cancele quando quiser</span>
            <div className="landing-trust-bar">
              <span>🔒 Privacidade por design (LGPD)</span>
              <span className="sep">·</span>
              <span>⚡ Zero app pro paciente</span>
              <span className="sep">·</span>
              <span>📋 Baseado nas suas prescrições</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="como-funciona">
        <div className="landing-section-inner">
          <div className="landing-eyebrow">Como funciona</div>
          <h2 className="landing-section-title">A IA conversa. Você acompanha.</h2>

          <div className="landing-step-block">
            <div className="landing-step-text">
              <div className="landing-step-num">01</div>
              <h3>O paciente fala naturalmente</h3>
              <p>
                Nada de formulário ou app estranho. O paciente manda mensagem no WhatsApp como faria
                pra qualquer pessoa. A IA entende contexto, gíria e emoção — e responde como uma
                nutricionista parceira, não como um robô.
              </p>
            </div>
            <ChatMockup />
          </div>

          <div className="landing-step-block">
            <div className="landing-step-text">
              <div className="landing-step-num">02</div>
              <h3>A IA extrai os dados automaticamente</h3>
              <p>
                Da conversa, a IA extrai apenas os dados de alimentação — alimento, quantidade,
                horário. Você vê refeições estruturadas, nunca o texto original.
              </p>
            </div>
            <ExtractionMockup />
          </div>

          <div className="landing-step-block">
            <div className="landing-step-text">
              <div className="landing-step-num">03</div>
              <h3>Você vê o que importa</h3>
              <p>
                No painel: adesão, macronutrientes, tendências. Sem ler conversas. A privacidade do
                paciente é garantida — e isso faz ele ser mais honesto.
              </p>
            </div>
            <DashboardMockup />
          </div>
        </div>
      </section>

      <section className="landing-section" id="como-a-ia-responde">
        <div className="landing-section-inner">
          <div className="landing-eyebrow">Como a IA responde</div>
          <h2 className="landing-section-title">Baseada no plano. Nunca inventa.</h2>
          <p className="landing-section-sub">
            A IA sempre consulta o plano alimentar que você montou antes de responder. Ela não
            inventa recomendações — orienta o paciente com base no que você prescreveu.
          </p>
          <div className="landing-ai-principles">
            <div className="landing-ai-card">
              <div className="landing-ai-card-num">1</div>
              <h4>Consulta o plano primeiro</h4>
              <p>
                Antes de responder, a IA carrega o plano alimentar do paciente. Toda orientação vem
                de lá.
              </p>
            </div>
            <div className="landing-ai-card">
              <div className="landing-ai-card-num">2</div>
              <h4>Redução de danos, não julgamento</h4>
              <p>
                O paciente vai comer o Xtudo? A IA ajuda a minimizar o impacto: tirar molho, dividir
                porção, beber água. Sem sermão.
              </p>
            </div>
            <div className="landing-ai-card">
              <div className="landing-ai-card-num">3</div>
              <h4>Dieta flexível, não rígida</h4>
              <p>
                A IA entende que a vida acontece. Ajuda o paciente a se adaptar dentro do plano —
                não a se punir por sair dele.
              </p>
            </div>
            <div className="landing-ai-card">
              <div className="landing-ai-card-num">4</div>
              <h4>Você vê o resultado, não a conversa</h4>
              <p>
                Do WhatsApp chegam dados estruturados. A conversa é privada. Você acompanha adesão,
                ajusta o plano e pronto.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt" id="funcionalidades">
        <div className="landing-section-inner">
          <div className="landing-eyebrow">Funcionalidades</div>
          <h2 className="landing-section-title">
            Tudo que você precisa. Nada que você não precisa.
          </h2>
          <div className="landing-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="landing-feature">
                <div className="landing-feature-icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="landing-showcase">
            <div className="landing-showcase-col">
              <div className="landing-showcase-label">Catálogo de alimentos porcionados</div>
              <FoodsMockup />
            </div>
            <div className="landing-showcase-col">
              <div className="landing-showcase-label">Evolução biométrica</div>
              <BioMockup />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="privacidade">
        <div className="landing-section-inner">
          <div className="landing-eyebrow">Diferencial</div>
          <h2 className="landing-section-title">Privacidade que gera honestidade.</h2>
          <div className="landing-privacy-grid">
            <div className="landing-privacy-card">
              <div className="landing-privacy-icon landing-privacy-no">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6" />
                  <path d="M9 9l6 6" />
                </svg>
              </div>
              <h4>Você NÃO vê</h4>
              <ul>
                <li>Mensagens originais</li>
                <li>Contexto pessoal</li>
                <li>Desabafos e ruminação</li>
                <li>Qualquer conteúdo além dos dados de alimentação</li>
              </ul>
            </div>
            <div className="landing-privacy-card">
              <div className="landing-privacy-icon landing-privacy-yes">
                <svg
                  width="24"
                  height="24"
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
              <h4>Você VÊ</h4>
              <ul>
                <li>Refeições estruturadas</li>
                <li>Quantidades e horários</li>
                <li>Percentual de adesão ao plano</li>
                <li>Alertas de risco (sem revelar texto)</li>
              </ul>
            </div>
          </div>
          <p className="landing-privacy-note">
            Resultados: pacientes são mais honestos quando sabem que o profissional não lê suas
            mensagens.
          </p>
        </div>
      </section>

      <section className="landing-section landing-section-alt" id="pricing">
        <div className="landing-section-inner">
          <div className="landing-eyebrow">Planos</div>
          <h2 className="landing-section-title">
            Tudo incluso. Só muda a quantidade de pacientes.
          </h2>
          <p className="landing-pricing-sub">
            Todas as funcionalidades em todos os planos. 30 dias grátis, cancele quando quiser.
          </p>
          <div className="landing-pricing">
            <div className="landing-pricing-card">
              <div className="landing-pricing-tag">Iniciante</div>
              <div className="landing-pricing-price">
                R$99<span>,99/mês</span>
              </div>
              <div className="landing-pricing-period">até 15 pacientes</div>
              <div className="landing-pricing-trial">30 dias grátis · cancele quando quiser</div>
              <ul className="landing-pricing-features">
                <li>Extração via WhatsApp</li>
                <li>Painel completo</li>
                <li>Planos alimentares</li>
                <li>Dados estruturados</li>
                <li>Exportar PDF</li>
                <li>Alertas de risco</li>
                <li>Inteligência agregada</li>
                <li>Avaliações biométricas</li>
                <li>Catálogo de alimentos</li>
              </ul>
              <Link to="/signup" className="btn btn-secondary landing-pricing-cta">
                Começar grátis
              </Link>
            </div>
            <div className="landing-pricing-card landing-pricing-popular">
              <div className="landing-pricing-badge">Mais popular</div>
              <div className="landing-pricing-tag">Profissional</div>
              <div className="landing-pricing-price">
                R$149<span>,99/mês</span>
              </div>
              <div className="landing-pricing-period">até 30 pacientes</div>
              <div className="landing-pricing-trial">30 dias grátis · cancele quando quiser</div>
              <ul className="landing-pricing-features">
                <li>Todas as funcionalidades</li>
                <li>Até 30 pacientes</li>
              </ul>
              <Link to="/signup" className="btn btn-primary landing-pricing-cta">
                Começar grátis
              </Link>
            </div>
            <div className="landing-pricing-card">
              <div className="landing-pricing-tag">Ilimitado</div>
              <div className="landing-pricing-price">
                R$199<span>,99/mês</span>
              </div>
              <div className="landing-pricing-period">pacientes ilimitados</div>
              <div className="landing-pricing-trial">30 dias grátis · cancele quando quiser</div>
              <ul className="landing-pricing-features">
                <li>Todas as funcionalidades</li>
                <li>Pacientes ilimitados</li>
              </ul>
              <Link to="/signup" className="btn btn-secondary landing-pricing-cta">
                Começar grátis
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="faq">
        <div className="landing-section-inner">
          <div className="landing-eyebrow">Perguntas frequentes</div>
          <h2 className="landing-section-title" style={{ marginBottom: 32 }}>
            Tudo o que você precisa saber
          </h2>
          <div className="landing-faq-accordion">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="landing-faq-card">
                  <button
                    type="button"
                    className="landing-faq-trigger"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <svg
                      className={`landing-faq-icon ${isOpen ? 'open' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="landing-faq-content">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-cta-final">
        <div className="landing-cta-final-inner">
          <h2>Pronto pra transformar o acompanhamento?</h2>
          <p>30 dias grátis. Todas as funcionalidades inclusas, cancele quando quiser.</p>
          <Link to="/signup" className="btn btn-primary landing-cta-btn">
            Começar agora
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <BrandLogo />
            <p className="landing-footer-copy">© 2026 Compas. Todos os direitos reservados.</p>
          </div>
          <div className="landing-footer-links">
            <a href="#privacidade">Termos de uso</a>
            <a href="#privacidade">Privacidade</a>
            <a href="#privacidade">LGPD</a>
            <a href="mailto:contato@compas.app.br">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
