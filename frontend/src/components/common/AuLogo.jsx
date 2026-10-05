/**
 * AuLogo — Aditya University Official Logo
 * Uses the official Aditya University logo from aec.edu.in
 */
const AU_LOGO_URL = 'https://www.aec.edu.in/adityanew/images/au_2.png'

export default function AuLogo({ size = 52, className = '' }) {
  return (
    <div
      className={`au-logo-badge ${className}`}
      style={{
        width: 80,
        height: 80,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0
      }}
    >
      <img
        src={AU_LOGO_URL}
        alt="Aditya University"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          filter: 'drop-shadow(0 4px 16px rgba(217, 155, 38, 0.5))',
          transition: 'filter 0.3s ease'
        }}
        onError={(e) => {
          // Fallback to local copy if CDN fails
          e.target.onerror = null
          e.target.src = '/aditya-logo.png'
        }}
      />
    </div>
  )
}
