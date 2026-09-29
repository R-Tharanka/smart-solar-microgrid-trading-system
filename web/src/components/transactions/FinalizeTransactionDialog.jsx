import { useEffect, useState } from 'react';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Modal from '../ui/Modal';

export default function FinalizeTransactionDialog({ reservation, open, loading, onClose, onConfirm }) {
  const [actualEnergy, setActualEnergy] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && reservation) {
      setActualEnergy(String(reservation.requestedEnergyKwh));
      setNote('Energy transfer completed successfully');
      setError('');
    }
  }, [open, reservation]);

  if (!reservation) return null;

  const submit = (event) => {
    event.preventDefault();
    const amount = Number(actualEnergy);
    if (!Number.isFinite(amount) || amount <= 0 || amount > Number(reservation.requestedEnergyKwh)) {
      setError(`Transferred energy must be greater than zero and no more than ${reservation.requestedEnergyKwh} kWh.`);
      return;
    }
    if (note.trim().length < 2) {
      setError('Enter a confirmation note of at least two characters.');
      return;
    }
    setError('');
    onConfirm({
      reservationCode: reservation.reservationCode,
      confirmationNote: note.trim(),
      actualEnergyTransferredKwh: amount,
    });
  };

  return (
    <Modal open={open} title="Finalize energy transfer" description={reservation.reservationCode} onClose={onClose} size="max-w-lg">
      <form className="space-y-4" onSubmit={submit}>
        <Alert type="info" title="Verified transaction">
          The Prosumer reserved {reservation.requestedEnergyKwh} kWh. Completion also closes the consumed booking slot.
        </Alert>
        {error ? <Alert>{error}</Alert> : null}
        <FormField
          id="actual-energy"
          label="Actual energy transferred (kWh)"
          type="number"
          min="0.001"
          max={reservation.requestedEnergyKwh}
          step="0.001"
          required
          value={actualEnergy}
          onChange={(event) => setActualEnergy(event.target.value)}
        />
        <FormField
          as="textarea"
          id="confirmation-note"
          label="Confirmation note"
          required
          minLength={2}
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>Complete transfer</Button>
        </div>
      </form>
    </Modal>
  );
}
