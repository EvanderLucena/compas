import { Modal } from '../ui/Modal';
import { IconSparkle, IconCheck, IconPlan, IconUsers } from '../icons';

interface ReadOnlyModalProps {
  open: boolean;
  onClose: () => void;
  onReactivate?: () => void;
}

export function ReadOnlyModal({ open, onClose, onReactivate }: ReadOnlyModalProps) {
  const handleReactivate = () => {
    onClose();
    if (onReactivate) {
      onReactivate();
    } else {
      // Default: dispatch event or open profile
      window.dispatchEvent(new CustomEvent('compas:open-profile', { detail: { tab: 'plan' } }));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modo Leitura — Consulta Preservada"
      className="max-w-lg"
    >
      <div className="flex flex-col gap-5 text-fg">
        <p className="text-sm text-fg-muted m-0 leading-relaxed">
          Sua assinatura do Compas está temporariamente inativa. Seus dados e prontuários pertencem
          a você e seu acesso para leitura continua <strong>100% garantido</strong>.
        </p>

        <div className="flex flex-col gap-3">
          <div
            className="flex items-start gap-3 p-3 rounded-lg border border-border"
            style={{ background: 'var(--surface-2)' }}
          >
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
              style={{ background: 'rgba(163, 230, 53, 0.15)', color: 'var(--sage)' }}
            >
              <IconCheck size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold text-fg">Consulta perpétua garantida</div>
              <div className="text-xs text-fg-muted mt-0.5 leading-snug">
                Visualize todos os pacientes, históricos clínicos, avaliações corporais e faça o
                download de planos alimentares oficiais e relatórios em PDF a qualquer momento.
              </div>
            </div>
          </div>

          <div
            className="flex items-start gap-3 p-3 rounded-lg border border-border"
            style={{ background: 'var(--surface-2)' }}
          >
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
              style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--amber)' }}
            >
              <IconPlan size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold text-fg">
                Novas edições temporariamente pausadas
              </div>
              <div className="text-xs text-fg-muted mt-0.5 leading-snug">
                A criação de novos planos, edição de macronutrientes, novos alimentos personalizados
                e registro de novas avaliações antropométricas exigem uma assinatura ativa.
              </div>
            </div>
          </div>

          <div
            className="flex items-start gap-3 p-3 rounded-lg border border-border"
            style={{ background: 'var(--surface-2)' }}
          >
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
              style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--sky)' }}
            >
              <IconUsers size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold text-fg">
                Atendimento no WhatsApp com pausa acolhedora
              </div>
              <div className="text-xs text-fg-muted mt-0.5 leading-snug">
                Mensagens recebidas de seus pacientes não geram custos de IA. O paciente recebe uma
                notificação gentil informando a pausa e solicitando o contato direto com você.
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost text-xs px-4 py-2 cursor-pointer"
          >
            Continuar em modo leitura
          </button>
          <button
            type="button"
            onClick={handleReactivate}
            className="btn btn-primary text-xs px-4 py-2 flex items-center gap-2 cursor-pointer"
            style={{ background: 'var(--lime)', color: 'var(--ink)', fontWeight: 600 }}
          >
            <IconSparkle size={14} />
            Reativar assinatura
          </button>
        </div>
      </div>
    </Modal>
  );
}
