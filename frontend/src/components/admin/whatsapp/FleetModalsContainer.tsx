import { useAdminWhatsappUIStore } from '../../../stores/adminWhatsappStore';
import { QrConnectModal } from './QrConnectModal';
import { CreateInstanceModal } from './CreateInstanceModal';
import { EditInstanceModal } from './EditInstanceModal';
import { MigratePatientsModal } from './MigratePatientsModal';
import { InstancePatientsModal } from './InstancePatientsModal';

export function FleetModalsContainer() {
  const activeModal = useAdminWhatsappUIStore((s) => s.activeModal);
  const selectedInstance = useAdminWhatsappUIStore((s) => s.selectedInstance);
  const closeModal = useAdminWhatsappUIStore((s) => s.closeModal);

  if (!activeModal) return null;

  return (
    <>
      {activeModal === 'qr' && selectedInstance && (
        <QrConnectModal instance={selectedInstance} onClose={closeModal} />
      )}
      {activeModal === 'create' && <CreateInstanceModal onClose={closeModal} />}
      {activeModal === 'edit' && selectedInstance && (
        <EditInstanceModal instance={selectedInstance} onClose={closeModal} />
      )}
      {activeModal === 'migrate' && selectedInstance && (
        <MigratePatientsModal sourceInstance={selectedInstance} onClose={closeModal} />
      )}
      {activeModal === 'patients' && selectedInstance && (
        <InstancePatientsModal instance={selectedInstance} onClose={closeModal} />
      )}
    </>
  );
}
