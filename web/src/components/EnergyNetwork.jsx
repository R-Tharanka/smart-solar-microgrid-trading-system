import { useId } from 'react';

export default function EnergyNetwork({ compact = false }) {
  const id = useId().replace(/:/g, '');
  return (
    <figure className={`energy-network ${compact ? 'energy-network-compact' : ''}`}>
      <div className="network-caption"><span className="signal-dot" /> Distributed energy network <span>Concept view</span></div>
      <svg viewBox="0 0 680 470" role="img" aria-label="Solar generation connects to battery storage, a microgrid hub, available energy and connected homes. Animated paths illustrate energy flow.">
        <defs>
          <pattern id={`grid-${id}`} width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#b9eacb" strokeOpacity=".075" /></pattern>
          <radialGradient id={`glow-${id}`}><stop stopColor="#81efab" stopOpacity=".18" /><stop offset="1" stopColor="#81efab" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="680" height="470" fill={`url(#grid-${id})`} />
        <ellipse cx="342" cy="248" rx="230" ry="205" fill={`url(#glow-${id})`} />
        <g fill="none" stroke="#b8eac8" strokeOpacity=".15">
          <ellipse cx="340" cy="250" rx="225" ry="116" transform="rotate(-22 340 250)" />
          <ellipse cx="340" cy="250" rx="266" ry="157" transform="rotate(-22 340 250)" />
        </g>
        <g fill="none" strokeWidth="2" strokeLinejoin="round">
          {['M136 145H220V244H299','M136 340H222V266H299','M385 248H471V135H545','M385 265H474V348H548','M345 207V85H445'].map((d, i) => <g key={d}><path d={d} stroke="#295447" /><path d={d} stroke={i % 2 ? '#6fcdd1' : '#b1f688'} className="energy-path" style={{ animationDelay: `-${i * 1.1}s` }} /></g>)}
        </g>
        <g transform="translate(83 77)" stroke="#e3be70" strokeWidth="2" fill="none">
          <circle cx="43" cy="22" r="13" /><path d="M43 0v5m0 34v5M21 22h5m34 0h5M27 6l4 4m24 24 4 4M27 38l4-4M55 10l4-4" />
          <path d="M7 56h72l10 38H0Zm7 13h67M9 81h77M27 56l-3 38m28-38 3 38M43 94v14m-18 0h36" stroke="#a7eec1" />
          <text x="43" y="140" className="network-label">Solar generation</text>
        </g>
        <g transform="translate(100 290)" stroke="#6fcdd1" strokeWidth="2" fill="none">
          <rect x="0" y="0" width="62" height="84" rx="9" fill="#102a27" /><path d="M22 0v-7h18v7M13 21h36M13 39h36M13 57h36" /><text x="31" y="110" className="network-label">Energy storage</text>
        </g>
        <g transform="translate(294 201)">
          <path d="m48-13 52 30v60l-52 30-52-30V17Z" fill="#142d25" stroke="#94efaa" strokeOpacity=".3" />
          <path d="m48 0 40 23v47L48 93 8 70V23Z" fill="#1d3a2b" stroke="#b1f688" />
          <path d="m51 19-20 30h16l-5 25 24-34H50Z" fill="#b1f688" />
          <text x="48" y="127" className="network-label">Microgrid hub</text>
        </g>
        <g transform="translate(509 91)" stroke="#b1f688" strokeWidth="2" fill="none">
          <rect width="74" height="82" rx="12" fill="#142b24" /><path d="M18 27h38M18 42h26M18 57h38" /><circle cx="56" cy="42" r="4" fill="#b1f688" /><text x="37" y="112" className="network-label">Available energy</text>
        </g>
        <g transform="translate(511 309)" stroke="#9cd4ce" strokeWidth="2" fill="none">
          <path d="m0 27 28-22 28 22v43H0Zm39-7V0h33v70H56M11 42h12v12H11m23-12h12v12H34M53 13h7m-7 12h7M22 70V57h12v13" fill="#142b27" />
          <text x="36" y="99" className="network-label">Connected community</text>
        </g>
        <g transform="translate(441 59)" fill="none" stroke="#779d90"><path d="m9 0-9 50m9-50 12 50M1 16h18M-3 31h26M9 0v50" strokeWidth="2" /><text x="47" y="27" textAnchor="start" className="network-label">Grid connection</text></g>
        <circle cx="222" cy="266" r="4" fill="#b1f688" /><circle cx="474" cy="265" r="4" fill="#6fcdd1" />
      </svg>
      {!compact && <figcaption>Generation. Storage. Exchange.<span>One connected energy ecosystem.</span></figcaption>}
    </figure>
  );
}
