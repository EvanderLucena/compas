import { useState, useRef } from 'react';
import { IconBookmark, IconX } from '../icons';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useSavePlanAsTemplate } from '../../stores/planTemplateStore';
import type { MealPlan } from '../../types/plan';

interface SaveAsTemplateModalProps {
  patientId: string;
  plan: MealPlan;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'GERAL', label: 'Geral' },
  { value: 'EQUILIBRIO', label: 'Equilíbrio' },
  { value: 'EMAGRECIMENTO', label: 'Emagrecimento' },
  { value: 'HIPERTROFIA', label: 'Hipertrofia' },
  { value: 'LOW CARB', label: 'Low Carb' },
  { value: 'VEGETARIANO', label: 'Vegetariano' },
];

function SaveTemplateFormFields({
  name,
  setName,
  category,
  setCategory,
  description,
  setDescription,
  totalMeals,
  totalExtras,
  kcalTarget,
}: {
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  totalMeals: number;
  totalExtras: number;
  kcalTarget: number;
}) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--surface-2)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--fg-muted)',
          lineHeight: 1.5,
        }}
      >
        Este modelo salvará o snapshot do plano atual com{' '}
        <strong style={{ color: 'var(--fg)' }}>{totalMeals} refeições</strong>,{' '}
        <strong style={{ color: 'var(--fg)' }}>{totalExtras} itens extras</strong> e meta de{' '}
        <strong style={{ color: 'var(--fg)' }}>{kcalTarget || 2000} kcal</strong> para reutilização
        em qualquer paciente.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label className="eyebrow" htmlFor="template-name">
          Nome do Modelo *
        </label>
        <input
          id="template-name"
          data-testid="input-template-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Dieta Equilíbrio 2000 kcal"
          required
          style={{
            padding: '8px 10px',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 13,
            background: 'var(--surface)',
            outline: 'none',
            color: 'var(--fg)',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label className="eyebrow" htmlFor="template-category">
          Categoria
        </label>
        <select
          id="template-category"
          data-testid="select-template-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: '8px 10px',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 13,
            background: 'var(--surface)',
            outline: 'none',
            color: 'var(--fg)',
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label className="eyebrow" htmlFor="template-description">
          Descrição (opcional)
        </label>
        <textarea
          id="template-description"
          data-testid="input-template-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Ex: Ideal para fase de manutenção e rotina diária equilibrada"
          style={{
            padding: '8px 10px',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 13,
            background: 'var(--surface)',
            outline: 'none',
            color: 'var(--fg)',
            resize: 'vertical',
          }}
        />
      </div>
    </div>
  );
}

export function SaveAsTemplateModal({ patientId, plan, onClose }: SaveAsTemplateModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  const [name, setName] = useState(plan.title ? `Modelo - ${plan.title}` : 'Novo Modelo');
  const [category, setCategory] = useState('EQUILIBRIO');
  const [description, setDescription] = useState('');

  const saveMutation = useSavePlanAsTemplate(patientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    saveMutation.mutate({
      name: name.trim(),
      category,
      description: description.trim() || undefined,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,12,10,0.4)',
        zIndex: 200,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-template-title"
        tabIndex={-1}
        className="card outline-none"
        style={{ width: 'min(480px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div
            id="save-template-title"
            className="title"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <IconBookmark size={16} /> Salvar como Modelo
          </div>
          <div className="spacer" />
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '4px 6px' }}
            aria-label="Fechar"
          >
            <IconX size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <SaveTemplateFormFields
            name={name}
            setName={setName}
            category={category}
            setCategory={setCategory}
            description={description}
            setDescription={setDescription}
            totalMeals={plan.meals?.length ?? 0}
            totalExtras={plan.extras?.length ?? 0}
            kcalTarget={plan.kcalTarget}
          />

          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              background: 'var(--surface-2)',
            }}
          >
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={saveMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-confirm-save-template"
              className="btn btn-primary"
              disabled={!name.trim() || saveMutation.isPending}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: name.trim() && !saveMutation.isPending ? 1 : 0.5,
              }}
            >
              <IconBookmark size={13} />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Modelo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
