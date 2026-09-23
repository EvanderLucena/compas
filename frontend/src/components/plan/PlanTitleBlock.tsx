import { useState } from 'react';

interface PlanTitleBlockProps {
  title: string;
  createdAt: string;
  updatedAt: string;
  isReadOnly: boolean;
  onUpdateTitle: (title: string) => void;
  onReadOnlyClick: () => void;
}

export function PlanTitleBlock({
  title,
  createdAt,
  updatedAt,
  isReadOnly,
  onUpdateTitle,
  onReadOnlyClick,
}: PlanTitleBlockProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue.trim() !== title) {
      onUpdateTitle(titleValue.trim());
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleBlur();
    if (e.key === 'Escape') setEditingTitle(false);
  };

  const handleStartTitleEdit = () => {
    if (isReadOnly) {
      onReadOnlyClick();
      return;
    }
    setTitleValue(title);
    setEditingTitle(true);
  };

  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div className="eyebrow">PLANO ATUAL</div>
      {editingTitle ? (
        <input
          autoFocus
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
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
          onClick={handleStartTitleEdit}
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
          {title}
        </h2>
      )}
      <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
        Criado {new Date(createdAt).toLocaleDateString('pt-BR')} · atualizado{' '}
        {new Date(updatedAt).toLocaleDateString('pt-BR')}
      </div>
    </div>
  );
}
