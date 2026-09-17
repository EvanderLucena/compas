import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { IconUser, IconLock, IconCreditCard } from '../icons';
import { getProfile } from '../../api/nutritionist';
import type { NutritionistProfile } from '../../types';
import { ProfileDetailsTab } from './ProfileDetailsTab';
import { ProfileSecurityTab } from './ProfileSecurityTab';
import { ProfilePlanTab } from './ProfilePlanTab';

type TabKey = 'profile' | 'security' | 'plan';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [profile, setProfile] = useState<NutritionistProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Erro ao carregar dados do perfil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchProfile();
    }
  }, [open, fetchProfile]);

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'profile', label: 'Dados Profissionais', icon: <IconUser size={14} /> },
    { key: 'security', label: 'Segurança & Senha', icon: <IconLock size={14} /> },
    { key: 'plan', label: 'Plano & Limites', icon: <IconCreditCard size={14} /> },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Meu Perfil" className="max-w-xl">
      {/* Tabs navigation */}
      <div
        className="flex items-center gap-1 border-b border-border pb-3 mb-4"
        style={{ overflowX: 'auto' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 cursor-pointer"
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'var(--surface-2)' : 'transparent',
                color: isActive ? 'var(--fg)' : 'var(--fg-muted)',
                border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading & Error states */}
      {loading && (
        <div className="py-8 text-center" style={{ color: 'var(--fg-muted)', fontSize: 13 }}>
          Carregando informações do perfil...
        </div>
      )}

      {error && !loading && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 6,
            fontSize: 13,
            background: 'var(--coral-dim)',
            color: '#fff',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Tab content */}
      {!loading && profile && (
        <>
          {activeTab === 'profile' && (
            <ProfileDetailsTab profile={profile} onUpdated={(updated) => setProfile(updated)} />
          )}
          {activeTab === 'security' && <ProfileSecurityTab />}
          {activeTab === 'plan' && <ProfilePlanTab profile={profile} />}
        </>
      )}
    </Modal>
  );
}
