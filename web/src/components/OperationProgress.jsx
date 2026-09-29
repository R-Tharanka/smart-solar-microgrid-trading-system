const stages = ['Reservation', 'Verification', 'Energy transfer', 'Completed'];
const positions = { Pending: 0, Approved: 0, QrIssued: 1, Verified: 2, Completed: 3, Rejected: 0, Cancelled: 0, Expired: 0 };

export default function OperationProgress({ status }) {
  const position = positions[status];
  const terminal = ['Rejected', 'Cancelled', 'Expired'].includes(status);
  return <div className="operation-progress" aria-label={status ? `Energy exchange progress: ${status}` : 'Energy exchange workflow'}>
    {stages.map((stage, index) => <div key={stage} className={position !== undefined && index <= position ? `reached ${index === position ? 'current' : ''} ${terminal && index === position ? 'terminal' : ''}` : ''} aria-current={index === position ? 'step' : undefined}><strong>0{index + 1}</strong>{stage}</div>)}
  </div>;
}
