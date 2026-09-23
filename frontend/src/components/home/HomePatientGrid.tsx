import type { Patient } from '../../types/patient';
import { HomePatientCard } from './HomePatientCard';

interface HomePatientGridProps {
  patients: Patient[];
  patientCountText: string;
  isLoading: boolean;
  onNavigate: (id: string) => void;
}

export function HomePatientGrid({
  patients,
  patientCountText,
  isLoading,
  onNavigate,
}: HomePatientGridProps) {
  return (
    <>
      <div className="divider">
        <span>Sua carteira · {isLoading ? '...' : patientCountText}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {patients.map((p) => (
          <HomePatientCard key={p.id} p={p} onNavigate={onNavigate} />
        ))}
      </div>
    </>
  );
}
