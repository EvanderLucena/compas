import { useState } from 'react';
import { IconPlus, IconX, IconTrash, IconEdit } from '../components/icons';
import { parseNumberInput } from '../utils/numberInput';
import {
  PlanFoodRow,
  OptionTab,
  AddFoodModal,
  AddMealModal,
  ExtrasSection,
  SaveStatusIndicator,
} from '../components/plan';
import {
  usePlan,
  usePlanUIStore,
  useUpdatePlan,
  useAddMealSlot,
  useDeleteMealSlot,
  useUpdateMealSlot,
  useAddOption,
  useAddFoodItem,
  useUpdateFoodItem,
  useDeleteFoodItem,
  useAddExtra,
  useUpdateExtra,
  useDeleteExtra,
} from '../stores/planStore';
import { useToastStore } from '../stores/toastStore';
import { resolveMutationErrorMessage } from '../stores/patientStore';

function DailyMacro({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 82 }}>
      <div className="eyebrow">{label}</div>
      <div
        className="mono tnum"
        style={{ fontSize: 22, fontWeight: 500, color, letterSpacing: '-0.02em', marginTop: 2 }}
      >
        {value}
      </div>
      {sub && (
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function TotalCell({
  label,
  actual,
  target,
  unit = '',
  color,
}: {
  label: string;
  actual: number;
  target: number;
  unit?: string;
  color?: string;
}) {
  const pct = target > 0 ? actual / target : 0;
  const ok = pct >= 0.9 && pct <= 1.1;
  return (
    <div>
      <div className="eyebrow">
        {label} · {target}
        {unit}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
        <div
          className="mono tnum"
          style={{ fontSize: 18, fontWeight: 500, color: color || 'var(--fg)' }}
        >
          {actual}
          {unit}
        </div>
        {target > 0 && (
          <div
            className="mono tnum"
            style={{ fontSize: 11, color: ok ? 'var(--sage-dim)' : 'var(--amber)' }}
          >
            {pct >= 1 ? '+' : ''}
            {Math.round((pct - 1) * 100)}%
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  name,
  onClose,
  onConfirm,
}: {
  name: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
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
        className="card"
        style={{ width: 'min(400px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Excluir</h3>
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--fg-muted)',
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}
          >
            Tem certeza que deseja excluir <strong style={{ color: 'var(--fg)' }}>{name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn"
              style={{ background: 'var(--coral)', color: '#fff', borderColor: 'transparent' }}
              onClick={onConfirm}
            >
              <IconTrash size={13} /> Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonPlan() {
  return (
    <div
      className="plans-grid"
      style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 620 }}
    >
      <div style={{ borderRight: '1px solid var(--border)', padding: '16px 14px' }}>
        <div style={{ padding: '0 6px 10px' }}>
          <div
            style={{ width: 100, height: 10, background: 'var(--surface-2)', borderRadius: 3 }}
          />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 6, marginBottom: 4 }}>
            <div
              style={{
                width: '60%',
                height: 13,
                background: 'var(--surface-2)',
                borderRadius: 3,
                marginBottom: 6,
              }}
            />
            <div
              style={{ width: '40%', height: 11, background: 'var(--surface-2)', borderRadius: 3 }}
            />
          </div>
        ))}
      </div>
      <div style={{ padding: '20px 24px', background: 'var(--bg)' }}>
        <div
          style={{
            width: 200,
            height: 26,
            background: 'var(--surface-2)',
            borderRadius: 4,
            marginBottom: 18,
          }}
        />
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{ width: 120, height: 32, background: 'var(--surface-2)', borderRadius: 6 }}
            />
          ))}
        </div>
        <div className="card">
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: '2.2fr 1fr 1fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px',
              gap: 10,
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                style={{ height: 10, background: 'var(--surface-2)', borderRadius: 2 }}
              />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '8px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: '2.2fr 1fr 1fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px',
                gap: 10,
              }}
            >
              {Array.from({ length: 9 }).map((_, j) => (
                <div
                  key={j}
                  style={{ height: 14, background: 'var(--surface-2)', borderRadius: 3 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PlansViewProps {
  patientId: string;
}

export function PlansView({ patientId }: PlansViewProps) {
  const { data: plan, isLoading } = usePlan(patientId);
  const planUI = usePlanUIStore();
  const activeMealId = planUI.activeMealId;
  const activeOptionIndex = planUI.activeOptionIndex;
  const addFoodModalOpen = planUI.addFoodModalOpen;
  const addMealModalOpen = planUI.addMealModalOpen;
  const pendingDeleteMealIds = planUI.pendingDeleteMealId;
  const pendingDeleteItemData = planUI.pendingDeleteItem;
  const saveStatus = planUI.saveStatus;
  const [section, setSection] = useState<'meals' | 'extras'>('meals');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealLabelValue, setMealLabelValue] = useState('');
  const [editingTargets, setEditingTargets] = useState(false);
  const [targetValues, setTargetValues] = useState({
    kcal: '',
    prot: '',
    carb: '',
    fat: '',
  });
  const [addFoodError, setAddFoodError] = useState<string | null>(null);
  const [addMealError, setAddMealError] = useState<string | null>(null);

  const updatePlan = useUpdatePlan(patientId);
  const addMealSlot = useAddMealSlot(patientId);
  const deleteMealSlot = useDeleteMealSlot(patientId);
  const updateMealSlot = useUpdateMealSlot(patientId);
  const addOption = useAddOption(patientId);
  const addFoodItem = useAddFoodItem(patientId);
  const updateFoodItem = useUpdateFoodItem(patientId);
  const deleteFoodItem = useDeleteFoodItem(patientId);
  const addExtra = useAddExtra(patientId);
  const updateExtra = useUpdateExtra(patientId);
  const deleteExtra = useDeleteExtra(patientId);

  // Track previous save status to detect error transitions
  const prevSaveStatus = useState(saveStatus);
  if (saveStatus === 'error' && prevSaveStatus[0] !== 'error') {
    // Toast will show automatically via saveStatus === 'error'
  }
  prevSaveStatus[0] = saveStatus;

  const meals = plan?.meals ?? [];
  const extras = plan?.extras ?? [];

  const activeMeal = meals.find((m) => m.id === activeMealId) ?? meals[0];
  const activeOptIdx = activeOptionIndex;
  const activeOpt = activeMeal?.options[activeOptIdx] ?? activeMeal?.options[0];

  const optTotals = activeOpt?.items.reduce(
    (a, x) => ({
      kcal: a.kcal + (Number(x.kcal) || 0),
      prot: a.prot + (Number(x.prot) || 0),
      carb: a.carb + (Number(x.carb) || 0),
      fat: a.fat + (Number(x.fat) || 0),
      fiber: a.fiber + (Number(x.fiber) || 0),
    }),
    { kcal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 },
  ) ?? { kcal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 };

  // Set initial activeMealId when plan loads
  if (plan && meals.length > 0 && !activeMealId) {
    planUI.setActiveMealId(meals[0].id);
  }

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (plan && titleValue.trim() && titleValue !== plan.title) {
      updatePlan.mutate({ title: titleValue.trim() });
    }
  };

  const handleDeleteFoodItem = () => {
    if (pendingDeleteItemData) {
      deleteFoodItem.mutate({
        mealId: pendingDeleteItemData.mealId,
        optionId: pendingDeleteItemData.optionId,
        itemId: pendingDeleteItemData.itemId,
      });
      planUI.setPendingDeleteItem(null);
    }
  };

  const handleDeleteMeal = () => {
    if (pendingDeleteMealIds) {
      deleteMealSlot.mutate(pendingDeleteMealIds);
      planUI.setPendingDeleteMealId(null);
    }
  };

  const handleAddExtra = () => {
    addExtra.mutate({ name: '', quantity: '' });
  };

  const handleSaveTargets = () => {
    const parsedTargets = {
      kcalTarget: parseNumberInput(targetValues.kcal),
      protTarget: parseNumberInput(targetValues.prot),
      carbTarget: parseNumberInput(targetValues.carb),
      fatTarget: parseNumberInput(targetValues.fat),
    };
    const hasInvalidTarget = Object.values(parsedTargets).some((value) => !Number.isFinite(value));
    if (hasInvalidTarget) {
      useToastStore.getState().showError('Preencha metas numéricas válidas antes de salvar');
      return;
    }

    updatePlan.mutate(parsedTargets);
    setEditingTargets(false);
  };

  const handleCancelTargets = () => {
    setEditingTargets(false);
  };

  if (isLoading || !plan) {
    return <SkeletonPlan />;
  }

  return (
    <div>
      <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="eyebrow">PLANO ATUAL</div>
            {editingTitle ? (
              <input
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleBlur();
                }}
                className="serif"
                style={{
                  fontSize: 24,
                  margin: '4px 0 4px',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--fg)',
                  padding: '0 0 2px',
                  color: 'var(--fg)',
                  outline: 'none',
                  width: '100%',
                  maxWidth: 400,
                }}
              />
            ) : (
              <h2
                onClick={() => {
                  setTitleValue(plan.title);
                  setEditingTitle(true);
                }}
                className="serif"
                style={{
                  fontSize: 24,
                  margin: '4px 0 4px',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  cursor: 'text',
                }}
                title="Clique para renomear"
              >
                {plan.title}
              </h2>
            )}
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              Criado {new Date(plan.createdAt).toLocaleDateString('pt-BR')} · atualizado{' '}
              {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexShrink: 0,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <SaveStatusIndicator status={saveStatus} />
          </div>
        </div>

        <div
          className="plans-macros-row"
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 16,
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          {editingTargets ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 82 }}>
                <div className="eyebrow">Kcal · meta</div>
                <input
                  inputMode="decimal"
                  autoFocus
                  value={targetValues.kcal}
                  onChange={(e) => setTargetValues((v) => ({ ...v, kcal: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTargets();
                  }}
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    color: 'var(--ink-contrast)',
                    letterSpacing: '-0.02em',
                    marginTop: 2,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--fg)',
                    outline: 'none',
                    width: 90,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 82 }}>
                <div className="eyebrow">Proteína</div>
                <input
                  inputMode="decimal"
                  value={targetValues.prot}
                  onChange={(e) => setTargetValues((v) => ({ ...v, prot: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTargets();
                  }}
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    color: 'var(--sage)',
                    letterSpacing: '-0.02em',
                    marginTop: 2,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--fg)',
                    outline: 'none',
                    width: 90,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 82 }}>
                <div className="eyebrow">Carboidrato</div>
                <input
                  inputMode="decimal"
                  value={targetValues.carb}
                  onChange={(e) => setTargetValues((v) => ({ ...v, carb: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTargets();
                  }}
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    color: 'var(--amber)',
                    letterSpacing: '-0.02em',
                    marginTop: 2,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--fg)',
                    outline: 'none',
                    width: 90,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 82 }}>
                <div className="eyebrow">Gordura</div>
                <input
                  inputMode="decimal"
                  value={targetValues.fat}
                  onChange={(e) => setTargetValues((v) => ({ ...v, fat: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTargets();
                  }}
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    color: 'var(--sky)',
                    letterSpacing: '-0.02em',
                    marginTop: 2,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--fg)',
                    outline: 'none',
                    width: 90,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                <button className="btn btn-ghost" onClick={handleCancelTargets}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleSaveTargets}>
                  Salvar
                </button>
              </div>
            </>
          ) : (
            <>
              <DailyMacro
                label="Kcal · meta"
                value={`${plan.kcalTarget}`}
                color="var(--ink-contrast)"
              />
              <DailyMacro label="Proteína" value={`${plan.protTarget}g`} color="var(--sage)" />
              <DailyMacro label="Carboidrato" value={`${plan.carbTarget}g`} color="var(--amber)" />
              <DailyMacro label="Gordura" value={`${plan.fatTarget}g`} color="var(--sky)" />
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setTargetValues({
                      kcal: String(plan.kcalTarget),
                      prot: String(plan.protTarget),
                      carb: String(plan.carbTarget),
                      fat: String(plan.fatTarget),
                    });
                    setEditingTargets(true);
                  }}
                  style={{ fontSize: 12, padding: '4px 8px' }}
                >
                  <IconEdit size={12} /> Editar metas
                </button>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            marginTop: 16,
            padding: '10px 12px',
            background: 'var(--surface-2)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--fg-muted)',
            lineHeight: 1.5,
            display: 'flex',
            gap: 10,
          }}
        >
          <span
            className="mono"
            style={{
              color: 'var(--lime-dim)',
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            OBSERVAÇÕES
          </span>
          <span>{plan.notes || 'Sem observações'}</span>
        </div>

        <div
          style={{
            marginTop: 14,
            display: 'flex',
            gap: 4,
            borderBottom: '1px solid var(--border)',
            marginBottom: -17,
          }}
        >
          {[
            { k: 'meals' as const, label: 'Refeições do plano' },
            { k: 'extras' as const, label: 'Opções extras · sem horário' },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setSection(t.k)}
              style={{
                padding: '10px 14px',
                fontSize: 13,
                color: section === t.k ? 'var(--fg)' : 'var(--fg-muted)',
                fontWeight: section === t.k ? 600 : 400,
                borderBottom: section === t.k ? '2px solid var(--fg)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {section === 'extras' ? (
        <ExtrasSection
          extras={extras}
          onUpdateExtra={(extraId, data) => updateExtra.mutate({ extraId, data })}
          onAddExtra={handleAddExtra}
          onDeleteExtra={(extraId) => deleteExtra.mutate(extraId)}
        />
      ) : (
        <div
          className="plans-grid"
          style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 620 }}
        >
          <div style={{ borderRight: '1px solid var(--border)', padding: '16px 14px' }}>
            <div className="eyebrow" style={{ padding: '0 6px 10px' }}>
              ESTRUTURA DO DIA
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {meals.map((m) => {
                const active = activeMeal?.id === m.id;
                const canRemove = meals.length > 1;
                const mTotals = m.options.reduce(
                  (a, opt) => {
                    const optT = opt.items.reduce(
                      (s, x) => ({
                        kcal: s.kcal + (Number(x.kcal) || 0),
                        prot: s.prot + (Number(x.prot) || 0),
                        carb: s.carb + (Number(x.carb) || 0),
                        fat: s.fat + (Number(x.fat) || 0),
                        fiber: s.fiber + (Number(x.fiber) || 0),
                      }),
                      { kcal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 },
                    );
                    return {
                      kcal: a.kcal + optT.kcal,
                      prot: a.prot + optT.prot,
                      carb: a.carb + optT.carb,
                      fat: a.fat + optT.fat,
                      fiber: a.fiber + optT.fiber,
                    };
                  },
                  { kcal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 },
                );
                return (
                  <div key={m.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        planUI.setActiveMealId(m.id);
                        planUI.setActiveOptionIndex(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          planUI.setActiveMealId(m.id);
                          planUI.setActiveOptionIndex(0);
                        }
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 6,
                        border: active ? '1px solid var(--fg)' : '1px solid transparent',
                        background: active ? 'var(--surface)' : 'transparent',
                        textAlign: 'left',
                        transition: 'all 0.12s',
                        width: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        {editingMealId === m.id ? (
                          <input
                            autoFocus
                            value={mealLabelValue}
                            onChange={(e) => setMealLabelValue(e.target.value)}
                            onBlur={() => {
                              if (mealLabelValue.trim() && mealLabelValue.trim() !== m.label) {
                                updateMealSlot.mutate({
                                  mealId: m.id,
                                  data: { label: mealLabelValue.trim() },
                                });
                              }
                              setEditingMealId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (mealLabelValue.trim() && mealLabelValue.trim() !== m.label) {
                                  updateMealSlot.mutate({
                                    mealId: m.id,
                                    data: { label: mealLabelValue.trim() },
                                  });
                                }
                                setEditingMealId(null);
                              } else if (e.key === 'Escape') {
                                setEditingMealId(null);
                              }
                              e.stopPropagation();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: 13,
                              fontWeight: active ? 600 : 500,
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px solid var(--fg)',
                              outline: 'none',
                              color: 'var(--fg)',
                              width: 120,
                              padding: '0 0 1px',
                              fontFamily: 'var(--font-ui)',
                            }}
                          />
                        ) : (
                          <span
                            style={{ fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'text' }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingMealId(m.id);
                              setMealLabelValue(m.label);
                            }}
                            title="Duplo clique para renomear"
                          >
                            {m.label}
                          </span>
                        )}
                        <div
                          style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span
                            className="mono tnum"
                            style={{ fontSize: 11, color: 'var(--fg-muted)' }}
                          >
                            {m.time}
                          </span>
                          {canRemove && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                planUI.setPendingDeleteMealId(m.id);
                              }}
                              style={{
                                color: 'var(--fg-subtle)',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                padding: 2,
                                lineHeight: 0,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--coral)')}
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = 'var(--fg-subtle)')
                              }
                            >
                              <IconX size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 10,
                          fontSize: 10.5,
                          color: 'var(--fg-muted)',
                        }}
                        className="mono tnum"
                      >
                        <span>{mTotals.kcal || 0}kcal</span>
                        <span>P{mTotals.prot || 0}</span>
                        <span>C{mTotals.carb || 0}</span>
                        <span>G{mTotals.fat || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button
                data-testid="add-meal-btn"
                onClick={() => planUI.setAddMealModalOpen(true)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1px dashed var(--border-2)',
                  color: 'var(--fg-muted)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  marginTop: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <IconPlus size={13} /> Adicionar refeição
              </button>
            </div>
          </div>

          {activeMeal && activeOpt && (
            <div style={{ padding: '20px 24px', background: 'var(--bg)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: 18,
                }}
              >
                <div>
                  <div className="eyebrow">
                    EDITANDO · {activeMeal.label.toUpperCase()} · {activeMeal.time}
                  </div>
                  <h2
                    className="serif"
                    style={{
                      fontSize: 26,
                      margin: '4px 0 0',
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {activeMeal.options.length} opções equivalentes
                  </h2>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
                {activeMeal.options.map((o, i) => (
                  <OptionTab
                    key={o.id}
                    name={o.name}
                    active={activeOptIdx === i}
                    onClick={() => planUI.setActiveOptionIndex(i)}
                    onRename={(_name) => {
                      // Double-click rename → update via API
                      // TODO: wire to useUpdateOption when PlanUIStore has mealId context
                    }}
                    onRemove={
                      activeMeal.options.length > 1
                        ? () => {
                            // Will be wired to useDeleteOption
                          }
                        : null
                    }
                  />
                ))}
                <button
                  onClick={() =>
                    addOption.mutate({
                      mealId: activeMeal.id,
                      data: { name: `Opção ${activeMeal.options.length + 1} · Cópia` },
                    })
                  }
                  style={{
                    padding: '7px 12px',
                    borderRadius: 6,
                    border: '1px dashed var(--border-2)',
                    background: 'transparent',
                    color: 'var(--fg-muted)',
                    fontSize: 12.5,
                  }}
                >
                  <IconPlus size={12} style={{ verticalAlign: '-2px' }} /> Nova opção
                </button>
              </div>

              <div className="card">
                <div
                  className="plans-food-table"
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '2.2fr 0.8fr 0.6fr 1.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 28px',
                    gap: 10,
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {[
                    'Alimento',
                    'Quantidade',
                    'Unidade',
                    'Preparo',
                    'Kcal',
                    'Prot',
                    'Carb',
                    'Gord',
                    'Fibra',
                    '',
                  ].map((h, i) => (
                    <div
                      key={i}
                      className="eyebrow"
                      style={{
                        fontSize: 10,
                        textAlign:
                          i >= 4 && i <= 8 ? 'right' : i === 1 || i === 2 ? 'center' : 'left',
                      }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {activeOpt.items.map((it) => (
                  <PlanFoodRow
                    key={it.id}
                    item={it}
                    isLast={it.id === activeOpt.items[activeOpt.items.length - 1]?.id}
                    onReferenceAmountChange={(referenceAmount) =>
                      updateFoodItem.mutate({
                        mealId: activeMeal.id,
                        optionId: activeOpt.id,
                        itemId: it.id,
                        data: { referenceAmount },
                      })
                    }
                    onPrepChange={(prep) =>
                      updateFoodItem.mutate({
                        mealId: activeMeal.id,
                        optionId: activeOpt.id,
                        itemId: it.id,
                        data: { prep },
                      })
                    }
                    onRemove={() =>
                      planUI.setPendingDeleteItem({
                        mealId: activeMeal.id,
                        optionId: activeOpt.id,
                        itemId: it.id,
                        name: it.foodName,
                      })
                    }
                  />
                ))}
                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    gap: 16,
                  }}
                >
                  <button
                    onClick={() => planUI.setAddFoodModalOpen(true)}
                    style={{ fontSize: 12, color: 'var(--fg-muted)' }}
                  >
                    <IconPlus size={12} style={{ verticalAlign: '-2px' }} /> Adicionar Alimento
                  </button>
                </div>
              </div>

              <div
                className="plans-totals-grid"
                style={{
                  marginTop: 16,
                  padding: '14px 18px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div className="eyebrow">TOTAL DA OPÇÃO</div>
                  <div
                    className="serif"
                    style={{ fontSize: 18, letterSpacing: '-0.01em', marginTop: 2 }}
                  >
                    {activeOpt.name}
                  </div>
                </div>
                <TotalCell label="Kcal" actual={optTotals.kcal} target={plan.kcalTarget} />
                <TotalCell
                  label="Proteína"
                  actual={optTotals.prot}
                  target={plan.protTarget}
                  unit="g"
                  color="var(--sage)"
                />
                <TotalCell
                  label="Carboidrato"
                  actual={optTotals.carb}
                  target={plan.carbTarget}
                  unit="g"
                  color="var(--amber)"
                />
                <TotalCell
                  label="Gordura"
                  actual={optTotals.fat}
                  target={plan.fatTarget}
                  unit="g"
                  color="var(--sky)"
                />
                <TotalCell
                  label="Fibra"
                  actual={optTotals.fiber}
                  target={0}
                  unit="g"
                  color="var(--lime-dim)"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {addFoodModalOpen && activeMeal && activeOpt && (
        <AddFoodModal
          onClose={() => {
            setAddFoodError(null);
            planUI.setAddFoodModalOpen(false);
          }}
          isSubmitting={addFoodItem.isPending}
          error={addFoodError}
          onAdd={(data) => {
            if (!activeMeal || !activeOpt) return;
            setAddFoodError(null);
            addFoodItem.mutate(
              {
                mealId: activeMeal.id,
                optionId: activeOpt.id,
                data: { foodId: data.foodId, referenceAmount: data.referenceAmount },
              },
              {
                onSuccess: () => {
                  useToastStore.getState().showSuccess('Alimento adicionado à refeição');
                  setAddFoodError(null);
                  planUI.setAddFoodModalOpen(false);
                },
                onError: (err) => {
                  const msg = resolveMutationErrorMessage(
                    err,
                    'Erro ao adicionar alimento à refeição',
                  );
                  setAddFoodError(msg);
                  useToastStore.getState().showError(msg);
                },
              },
            );
          }}
        />
      )}
      {addMealModalOpen && (
        <AddMealModal
          onClose={() => {
            setAddMealError(null);
            planUI.setAddMealModalOpen(false);
          }}
          isSubmitting={addMealSlot.isPending}
          error={addMealError}
          onAdd={(data) => {
            setAddMealError(null);
            addMealSlot.mutate(
              { label: data.label, time: data.time },
              {
                onSuccess: () => {
                  useToastStore.getState().showSuccess('Refeição criada com sucesso');
                  setAddMealError(null);
                  planUI.setAddMealModalOpen(false);
                },
                onError: (err) => {
                  const msg = resolveMutationErrorMessage(err, 'Erro ao criar refeição');
                  setAddMealError(msg);
                  useToastStore.getState().showError(msg);
                },
              },
            );
          }}
        />
      )}
      {pendingDeleteItemData && (
        <DeleteConfirmModal
          name={pendingDeleteItemData.name}
          onClose={() => planUI.setPendingDeleteItem(null)}
          onConfirm={handleDeleteFoodItem}
        />
      )}
      {pendingDeleteMealIds && (
        <DeleteConfirmModal
          name={meals.find((m) => m.id === pendingDeleteMealIds)?.label || 'esta refeição'}
          onClose={() => planUI.setPendingDeleteMealId(null)}
          onConfirm={handleDeleteMeal}
        />
      )}
    </div>
  );
}
