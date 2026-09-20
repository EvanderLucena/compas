import { useState } from 'react';
import { Link } from 'react-router';
import { IconCompas } from '../components/ui/CompasLogo';

const COMPARISONS = [
  {
    activity: 'Cobrança de diário alimentar',
    traditional: 'Mensagens manuais cansativas todo domingo',
    compas: 'Automático e acolhedor via WhatsApp diário',
  },
  {
    activity: 'Cálculo de macros reportados',
    traditional: 'Digitar manualmente alimento por alimento (25 min/paciente)',
    compas: 'Consolidação instantânea via TACO 4ª Edição (0 min)',
  },
  {
    activity: 'Dúvidas sobre substituição fora de hora',
    traditional: 'WhatsApp pessoal apitando em finais de semana e noites',
    compas: 'IA responde na hora seguindo sua lista de substitutos autorizados',
  },
  {
    activity: 'Detecção de desmotivação',
    traditional: 'Apenas quando o paciente desmarca ou falta ao retorno',
    compas: 'Alerta de risco disparado com 3 dias de silêncio',
  },
];

const PILLARS = [
  {
    num: 'EIXO 01',
    title: 'Zero Apps pro Paciente',
    text: 'O paciente não baixa nada novo. Ele fala com a IA no WhatsApp do jeito que fala com a família: por áudios despretensiosos, fotos de pratos ou texto rápido.',
  },
  {
    num: 'EIXO 02',
    title: 'Radar de Aderência',
    text: 'Saiba na hora quem está No Compasso, quem precisa de Ajuste ou quem entrou em Descompasso antes que abandonem o tratamento.',
  },
  {
    num: 'EIXO 03',
    title: 'Conduta Inviolável',
    text: 'A IA nunca inventa recomendações nem contradiz sua prescrição. As respostas utilizam exclusivamente as opções de substituição e os limites que você definiu no plano.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'O paciente precisa instalar algum aplicativo?',
    a: 'Não. O paciente utiliza exclusivamente o WhatsApp. A IA é a interface direta — sem downloads, sem novos cadastros e sem senhas para lembrar.',
  },
  {
    q: 'Eu consigo ler as conversas pessoais do paciente?',
    a: 'Não. Pelo princípio de privacidade por design e compliance LGPD, o painel recebe apenas os dados estruturados de alimentação (alimento, quantidade, horário e macros).',
  },
  {
    q: 'E se a IA extrair algum alimento com quantidade imprecisa?',
    a: 'Você tem total controle e pode editar qualquer dado diretamente no prontuário do paciente com um clique.',
  },
  {
    q: 'Como funciona o período de teste de 30 dias?',
    a: 'Você tem acesso completo a todos os recursos da plataforma durante 30 dias gratuitamente. Cancele a qualquer momento sem taxas.',
  },
  {
    q: 'Funciona com qualquer formato de plano alimentar?',
    a: 'Sim. Você estrutura as refeições, alimentos base e opções de substituição no painel. A IA utiliza exatamente as suas diretrizes como referência.',
  },
  {
    q: 'Os dados dos meus pacientes estão seguros?',
    a: 'Sim. Todos os dados são armazenados em servidores com criptografia de ponta a ponta e total conformidade com a LGPD.',
  },
];

function BrandLogo() {
  return (
    <Link to="/" className="landing-logo" aria-label="Compas - Início">
      <IconCompas size={22} />
      <span>
        compas<span style={{ color: 'var(--lime-dim)' }}>.</span>
      </span>
      <span
        className="brand-tag mono"
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: 'var(--lime-dim)',
          background: 'rgba(196, 241, 53, 0.1)',
          padding: '1px 5px',
          borderRadius: 4,
          border: '1px solid rgba(196, 241, 53, 0.25)',
          letterSpacing: '0.04em',
          marginLeft: 6,
        }}
      >
        SISTEMA CLÍNICO
      </span>
    </Link>
  );
}

function LiveHudMockup() {
  return (
    <div className="hud-container" id="demo">
      <div className="hud-header">
        <div className="hud-header-left">
          <div className="live-indicator" />
          <span className="hud-title">EXTRAÇÃO EM TEMPO REAL · WHATSAPP → PAINEL CLÍNICO</span>
        </div>
        <div className="hud-title" style={{ color: 'var(--sage)' }}>
          LGPD COMPLIANT · CRIPTOGRAFIA DE PONTA A PONTA
        </div>
      </div>

      <div className="hud-grid">
        <div className="whatsapp-box">
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--fg-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>PACIENTE: ANA BEATRIZ (ID: #402)</span>
            <span>HOJE, 13:12</span>
          </div>

          <div className="wa-patient">
            "Acabei de almoçar! Coloquei 180g de filé de frango grelhado, 4 colheres cheias de arroz
            integral e um prato bem farto de salada com tomate e azeite."
            <span className="wa-meta">13:12 · Enviado via WhatsApp</span>
          </div>

          <div className="wa-ai">
            <div className="wa-ai-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
              </svg>
              COMPAS AI · BASEADO NO PLANO DA DRA. HELENA
            </div>
            Excelente almoço, Ana! Fiquei feliz que manteve o arroz integral. Já registrei tudo no
            seu acompanhamento de hoje. Lembre-se de tomar água agora à tarde! 💧
          </div>
        </div>

        <div className="clinical-box">
          <div className="clinical-box-title">
            <span>DADOS EXTRAÍDOS PARA O PRONTUÁRIO</span>
            <span style={{ color: 'var(--sage)', fontSize: 10 }}>TABELA TACO 4ª ED.</span>
          </div>

          <div className="item-row">
            <span className="item-name">Peito de frango grelhado</span>
            <span className="item-qty">180g · 286 kcal</span>
          </div>
          <div className="item-row">
            <span className="item-name">Arroz integral cozido (4 colh.)</span>
            <span className="item-qty">120g · 149 kcal</span>
          </div>
          <div className="item-row">
            <span className="item-name">Salada verde mista + tomate</span>
            <span className="item-qty">100g · 22 kcal</span>
          </div>
          <div className="item-row">
            <span className="item-name">Azeite de oliva extra virgem</span>
            <span className="item-qty">8ml · 70 kcal</span>
          </div>

          <div className="macro-bars">
            <div className="macro-bar-row">
              <span className="macro-label">KCAL</span>
              <div className="macro-progress-bg">
                <div
                  className="macro-progress-fill"
                  style={{ width: '27%', background: 'var(--lime)' }}
                />
              </div>
              <span className="macro-val" style={{ color: 'var(--lime)' }}>
                527 / 1950
              </span>
            </div>
            <div className="macro-bar-row">
              <span className="macro-label">PROT</span>
              <div className="macro-progress-bg">
                <div
                  className="macro-progress-fill"
                  style={{ width: '42%', background: '#60A5FA' }}
                />
              </div>
              <span className="macro-val" style={{ color: '#60A5FA' }}>
                61.4g / 145g
              </span>
            </div>
            <div className="macro-bar-row">
              <span className="macro-label">CARB</span>
              <div className="macro-progress-bg">
                <div
                  className="macro-progress-fill"
                  style={{ width: '18%', background: 'var(--amber)' }}
                />
              </div>
              <span className="macro-val" style={{ color: 'var(--amber)' }}>
                34.2g / 185g
              </span>
            </div>
            <div className="macro-bar-row">
              <span className="macro-label">GORD</span>
              <div className="macro-progress-bg">
                <div
                  className="macro-progress-fill"
                  style={{ width: '24%', background: 'var(--sage)' }}
                />
              </div>
              <span className="macro-val" style={{ color: 'var(--sage)' }}>
                14.1g / 58g
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="landing-hero">
      <div className="landing-hero-inner">
        <div className="landing-eyebrow">Inteligência Nutricional Conversacional</div>
        <h1 className="landing-hero-title">
          O <em>compasso</em> clínico do nutricionista de alta performance.
        </h1>
        <p className="landing-hero-sub">
          Seus pacientes relatam refeições naturalmente no WhatsApp por áudio, foto ou texto. A IA
          do Compas extrai gramas, calorias e macros com base no seu plano alimentar. Você mantém o
          controle da conduta sem perder horas digitando.
        </p>
        <div className="landing-hero-cta">
          <Link to="/signup" className="btn btn-primary landing-cta-btn">
            Começar avaliação gratuita de 30 dias
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
      <LiveHudMockup />
    </section>
  );
}

function PillarsSection() {
  return (
    <section className="landing-section" id="extracao">
      <div className="landing-section-inner">
        <div className="landing-eyebrow">Precisão & Rigor Clínico</div>
        <h2 className="landing-section-title">
          Três eixos calibrados para a sua rotina no consultório.
        </h2>
        <p className="landing-hero-sub" style={{ margin: '0 0 40px', maxWidth: '100%' }}>
          Elimine o atrito que faz 70% dos pacientes abandonarem o diário alimentar na segunda
          semana.
        </p>
        <div className="pillars-grid">
          {PILLARS.map((p, idx) => (
            <div key={idx} className="pillar-card">
              <div className="pillar-num">{p.num}</div>
              <h3 className="pillar-title">{p.title}</h3>
              <p className="pillar-text">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className="landing-section landing-section-alt" id="comparativo">
      <div className="landing-section-inner">
        <div className="landing-eyebrow">Ganho de Tempo Real</div>
        <h2 className="landing-section-title">O que muda na sua prática semanal</h2>
        <div className="comp-table-wrap">
          <table className="comp-table">
            <thead>
              <tr>
                <th>Atividade Clínica</th>
                <th>Método Tradicional (Planilhas / Apps)</th>
                <th>Com o Compas</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISONS.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.activity}</td>
                  <td>{row.traditional}</td>
                  <td>{row.compas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="landing-section" id="pricing">
      <div className="landing-section-inner">
        <div className="landing-eyebrow">Planos</div>
        <h2 className="landing-section-title">Tudo incluso. Só muda a quantidade de pacientes.</h2>
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
              <li>Painel clínico completo</li>
              <li>Planos alimentares e TACO</li>
              <li>Dados estruturados sem invasão</li>
              <li>Alertas de desmotivação</li>
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
              <li>Até 30 pacientes ativos</li>
              <li>Suporte prioritário</li>
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
              <li>Acesso antecipado a novos recursos</li>
            </ul>
            <Link to="/signup" className="btn btn-secondary landing-pricing-cta">
              Começar grátis
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection({
  openFaq,
  onToggleFaq,
}: {
  openFaq: number | null;
  onToggleFaq: (i: number) => void;
}) {
  return (
    <section className="landing-section landing-section-alt" id="faq">
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
                  onClick={() => onToggleFaq(i)}
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
  );
}

function FinalCtaSection() {
  return (
    <section className="landing-cta-final">
      <div className="landing-cta-final-inner">
        <h2>Pronto pra calibrar o acompanhamento com o Compas?</h2>
        <p>30 dias grátis. Todas as funcionalidades inclusas, cancele quando quiser.</p>
        <Link to="/signup" className="btn btn-primary landing-cta-btn">
          Começar avaliação gratuita
        </Link>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-brand">
          <BrandLogo />
          <p className="landing-footer-copy">© 2026 Compas. Todos os direitos reservados.</p>
        </div>
        <div className="landing-footer-links">
          <a href="#demo">Demonstração</a>
          <a href="#extracao">Eixos</a>
          <a href="#comparativo">Comparativo</a>
          <a href="#pricing">Planos</a>
          <a href="#faq">FAQ</a>
          <a href="mailto:contato@compas.app.br">Contato</a>
        </div>
      </div>
    </footer>
  );
}

function LandingNav({
  mobileMenuOpen,
  onToggleMenu,
  onCloseMenu,
}: {
  mobileMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}) {
  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <BrandLogo />
        <div className="landing-nav-links">
          <a href="#demo">Demonstração</a>
          <a href="#extracao">Eixos</a>
          <a href="#comparativo">Comparativo</a>
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
          onClick={onToggleMenu}
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
          <a href="#demo" onClick={onCloseMenu}>
            Demonstração
          </a>
          <a href="#extracao" onClick={onCloseMenu}>
            Eixos
          </a>
          <a href="#comparativo" onClick={onCloseMenu}>
            Comparativo
          </a>
          <a href="#pricing" onClick={onCloseMenu}>
            Planos
          </a>
          <a href="#faq" onClick={onCloseMenu}>
            FAQ
          </a>
          <div className="landing-mobile-menu-ctas">
            <Link to="/login" className="btn btn-secondary" onClick={onCloseMenu}>
              Entrar
            </Link>
            <Link to="/signup" className="btn btn-primary" onClick={onCloseMenu}>
              Começar grátis
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export function LandingView() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="landing">
      <LandingNav
        mobileMenuOpen={mobileMenuOpen}
        onToggleMenu={() => setMobileMenuOpen((o) => !o)}
        onCloseMenu={() => setMobileMenuOpen(false)}
      />
      <HeroSection />
      <PillarsSection />
      <ComparisonSection />
      <PricingSection />
      <FaqSection openFaq={openFaq} onToggleFaq={(i) => setOpenFaq(openFaq === i ? null : i)} />
      <FinalCtaSection />
      <LandingFooter />
    </div>
  );
}
