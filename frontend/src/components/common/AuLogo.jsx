/**
 * AuLogo — Aditya University Official Logo
 * Uses the official Aditya University crest and logo
 */
const AU_CREST_URL = '/aditya-crest.png'
const AU_LOGO_URL = '/aditya-logo.png'

export default function AuLogo({ size = 52, className = '', variant = 'crest' }) {
  const imgSrc = variant === 'full' ? AU_LOGO_URL : AU_CREST_URL
  return (
    <div
      className={`au-logo-badge ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0
      }}
    >
      <img
        src={imgSrc}
        alt="Aditya University"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 10px rgba(184, 147, 76, 0.45))',
          transition: 'transform 0.2s ease, filter 0.2s ease'
        }}
        onError={(e) => {
          e.target.onerror = null
          e.target.src = '/aditya-logo.png'
        }}
      />
    </div>
  )
}
