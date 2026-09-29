import { useState } from 'react';
import { QrCodeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import { Panel, SectionHeader } from '../ui/Surface';
import { parseQrPayload } from '../../utils/transaction';

export default function VerifyTransactionPanel({ onVerify, submitting }) {
  const [qrPayload, setQrPayload] = useState('');
  const [fields, setFields] = useState({ reservationCode: '', transactionToken: '' });
  const [payloadError, setPayloadError] = useState('');
  const [expiresAtUtc, setExpiresAtUtc] = useState('');

  const readPayload = () => {
    try {
      const parsed = parseQrPayload(qrPayload);
      setFields({ reservationCode: parsed.reservationCode, transactionToken: parsed.transactionToken });
      setExpiresAtUtc(parsed.expiresAtUtc);
      setPayloadError('');
    } catch (error) {
      setPayloadError(error.message);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    setPayloadError('');
    onVerify({
      reservationCode: fields.reservationCode.trim(),
      transactionToken: fields.transactionToken.trim(),
    });
  };

  return (
    <Panel className="p-5 sm:p-6">
      <SectionHeader
        title="Verify QR transaction"
        description="Paste the JSON decoded by the operator QR scanner, or enter its secure values manually."
      />
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="app-panel-muted p-4">
          <FormField
            as="textarea"
            id="qr-payload"
            label="Decoded QR payload"
            value={qrPayload}
            onChange={(event) => setQrPayload(event.target.value)}
            placeholder={'{"reservationCode":"RSV-...","transactionToken":"...","expiresAtUtc":"..."}'}
            hint="The browser does not store this token after the request."
          />
          <Button className="mt-3" variant="secondary" icon={QrCodeIcon} onClick={readPayload}>Read QR payload</Button>
          {payloadError ? <Alert className="mt-3">{payloadError}</Alert> : null}
          {expiresAtUtc ? <Alert className="mt-3" type="info" title="QR expiry">{new Date(expiresAtUtc).toLocaleString()}</Alert> : null}
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <FormField
            id="verify-reservation-code"
            label="Reservation code"
            required
            value={fields.reservationCode}
            onChange={(event) => setFields((current) => ({ ...current, reservationCode: event.target.value }))}
            placeholder="RSV-20260929-ABC123"
          />
          <FormField
            id="verify-transaction-token"
            label="Transaction token"
            required
            minLength={20}
            value={fields.transactionToken}
            onChange={(event) => setFields((current) => ({ ...current, transactionToken: event.target.value }))}
            placeholder="Opaque token from the QR code"
          />
          <Button type="submit" icon={ShieldCheckIcon} loading={submitting}>Verify transaction</Button>
        </form>
      </div>
    </Panel>
  );
}
