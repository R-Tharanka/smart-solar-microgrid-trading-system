const stages = ['Reservation', 'Verification', 'Energy transfer', 'Completed'];
const positions = { Pending: 0, Approved: 0, QrIssued: 1, Verified: 2, Completed: 3 };

export default function OperationProgress({ status }) {
  const position = positions[status];
  return <div className="operation-progress" aria-label={status ? `Energy exchange progress: ${status}` : 'Energy exchange workflow'}>
    {stages.map((stage, index) => <div key={stage} className={position !== undefined && index <= position ? `reached ${index === position ? 'current' : ''}` : ''} aria-current={index === position ? 'step' : undefined}><strong>0{index + 1}</strong>{stage}</div>)}
  </div>;
}
