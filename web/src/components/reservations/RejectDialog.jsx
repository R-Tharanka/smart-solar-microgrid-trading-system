import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Modal from '../ui/Modal';

export default function RejectDialog({ isOpen, onClose, onConfirm, isSubmitting }) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (!isOpen) setReason(''); }, [isOpen]);
  const handleSubmit = (event) => { event.preventDefault(); if (reason.trim().length >= 2) onConfirm(reason.trim()); };
  return <Modal open={isOpen} onClose={onClose} title="Reject reservation" description="Provide a reason that can be recorded with the reservation." size="max-w-md"><form onSubmit={handleSubmit}><FormField as="textarea" id="rejection-reason" label="Reason" required minLength={2} maxLength={500} rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Station capacity is unavailable at the requested time." /><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button><Button type="submit" variant="danger" loading={isSubmitting} disabled={reason.trim().length < 2}>Reject reservation</Button></div></form></Modal>;
}
