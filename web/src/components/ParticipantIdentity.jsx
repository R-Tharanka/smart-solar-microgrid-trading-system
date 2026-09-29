export default function ParticipantIdentity({ firstName, lastName, detail }) {
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  return <div className="participant-identity"><span className="participant-avatar" aria-hidden="true">{initials || '•'}</span><div><strong>{firstName} {lastName}</strong>{detail && <span>{detail}</span>}</div></div>;
}
