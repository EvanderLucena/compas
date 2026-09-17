import { useState } from 'react';
import type { NutritionistProfile, UpdateProfileRequest } from '../../types';
import { updateProfile } from '../../api/nutritionist';
import { useAuthStore } from '../../stores/authStore';

const CRN_REGIONS = [
  'CRN-1 (DF, GO, MT, TO)',
  'CRN-2 (RS)',
  'CRN-3 (SP, MS)',
  'CRN-4 (RJ, ES)',
  'CRN-5 (BA, SE)',
  'CRN-6 (AL, PB, PE, RN)',
  'CRN-7 (AC, AM, AP, PA, RO, RR)',
  'CRN-8 (PR)',
  'CRN-9 (MG)',
  'CRN-10 (SC)',
  'CRN-11 (CE, MA, PI)',
  'Outro',
];

const INPUT_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 13,
  background: 'var(--surface)',
  color: 'var(--fg)',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-ui)',
  outline: 'none',
};

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function BasicFields({
  name,
  setName,
  email,
}: {
  name: string;
  setName: (v: string) => void;
  email: string;
}) {
  return (
    <>
      <div>
        <label className="eyebrow block mb-1">Nome Completo</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dra. Seu Nome"
          style={INPUT_STYLE}
          required
        />
      </div>

      <div>
        <label className="eyebrow block mb-1">E-mail da Conta</label>
        <input
          type="email"
          value={email}
          disabled
          style={{
            ...INPUT_STYLE,
            opacity: 0.65,
            cursor: 'not-allowed',
            background: 'var(--surface-2)',
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 4, display: 'block' }}>
          O e-mail de acesso não pode ser alterado diretamente.
        </span>
      </div>
    </>
  );
}

function CrnAndContactFields({
  crn,
  setCrn,
  crnRegional,
  setCrnRegional,
  specialty,
  setSpecialty,
  whatsapp,
  setWhatsapp,
}: {
  crn: string;
  setCrn: (v: string) => void;
  crnRegional: string;
  setCrnRegional: (v: string) => void;
  specialty: string;
  setSpecialty: (v: string) => void;
  whatsapp: string;
  setWhatsapp: (v: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow block mb-1">Registro CRN</label>
          <input
            type="text"
            value={crn}
            onChange={(e) => setCrn(e.target.value)}
            placeholder="Ex: 12345"
            style={INPUT_STYLE}
          />
        </div>
        <div>
          <label className="eyebrow block mb-1">Região do CRN</label>
          <select
            value={crnRegional}
            onChange={(e) => setCrnRegional(e.target.value)}
            style={INPUT_STYLE}
          >
            <option value="">Selecione a região...</option>
            {CRN_REGIONS.map((r) => (
              <option key={r} value={r.split(' ')[0]}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow block mb-1">Especialidade Principal</label>
          <input
            type="text"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Ex: Nutrição Esportiva e Clínica"
            style={INPUT_STYLE}
          />
        </div>
        <div>
          <label className="eyebrow block mb-1">WhatsApp Profissional</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            style={INPUT_STYLE}
          />
        </div>
      </div>
    </>
  );
}

interface ProfileDetailsTabProps {
  profile: NutritionistProfile;
  onUpdated: (updated: NutritionistProfile) => void;
}

export function ProfileDetailsTab({ profile, onUpdated }: ProfileDetailsTabProps) {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [name, setName] = useState(profile.name || '');
  const [crn, setCrn] = useState(profile.crn || '');
  const [crnRegional, setCrnRegional] = useState(profile.crnRegional || '');
  const [specialty, setSpecialty] = useState(profile.specialty || '');
  const [whatsapp, setWhatsapp] = useState(formatPhone(profile.whatsapp || ''));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'O nome completo é obrigatório.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload: UpdateProfileRequest = {
        name: name.trim(),
        crn: crn.trim() || null,
        crnRegional: crnRegional.trim() || null,
        specialty: specialty.trim() || null,
        whatsapp: whatsapp.replace(/\D/g, '') || null,
      };
      const updated = await updateProfile(payload);
      updateUser({ name: updated.name });
      onUpdated(updated);
      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setMessage({ type: 'error', text: apiErr.message || 'Erro ao salvar alterações.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {message && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            fontSize: 12,
            background: message.type === 'success' ? 'var(--sage-dim)' : 'var(--coral-dim)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          {message.text}
        </div>
      )}

      <BasicFields name={name} setName={setName} email={profile.email} />
      <CrnAndContactFields
        crn={crn}
        setCrn={setCrn}
        crnRegional={crnRegional}
        setCrnRegional={setCrnRegional}
        specialty={specialty}
        setSpecialty={setSpecialty}
        whatsapp={whatsapp}
        setWhatsapp={setWhatsapp}
      />

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="btn btn-primary cursor-pointer"
          style={{ padding: '8px 20px', fontSize: 13 }}
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}
