/**
 * Enterprise URL & Request Parameter Resolver for Frontend
 * Bulletproof extraction of canonical Certificate IDs, Fee Receipts, and Challan codes
 * from QR codes, complex URLs, query strings, and messy user paste inputs.
 */

/**
 * Recursively decodes a URI string to unwrap nested percent-encoding (%252F, %2F, etc.)
 */
export function deepUrlDecode(str) {
  if (!str || typeof str !== 'string') return ''
  let current = str.trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width characters
    .replace(/^["']|["']$/g, '')          // remove surrounding quotes
  
  for (let i = 0; i < 3; i++) {
    if (current.includes('%') || current.includes('+')) {
      try {
        const decoded = decodeURIComponent(current.replace(/\+/g, ' '))
        if (decoded === current) break
        current = decoded
      } catch {
        break
      }
    } else {
      break
    }
  }
  return current.trim()
}

/**
 * Extracts a Certificate ID from raw input, URL, or URLSearchParams object
 */
export function resolveCertificateId(input, searchParams = null) {
  // 1. If URLSearchParams is passed, inspect common keys first
  if (searchParams && typeof searchParams.get === 'function') {
    const keys = [
      'url', 'certificateId', 'certificate_id', 'certId', 'cert_id',
      'id', 'code', 'target', 'q', 'ref', 'cert'
    ]
    for (const key of keys) {
      const val = searchParams.get(key)
      if (val) {
        const extracted = extractCertIdFromString(val)
        if (extracted) return extracted
      }
    }
  }

  // 2. Direct string extraction
  return extractCertIdFromString(input)
}

function extractCertIdFromString(raw) {
  if (!raw || typeof raw !== 'string') return ''
  const decoded = deepUrlDecode(raw)

  // Pattern 1: AUS format with digits (e.g. AUS543444, AUS543445)
  const ausMatch = decoded.match(/\b(AUS\d{5,8})\b/i)
  if (ausMatch && ausMatch[1]) {
    return ausMatch[1].toUpperCase()
  }

  // Pattern 2: AU-SIS legacy certificate format
  const legacyMatch = decoded.match(/\b(AU-SIS-[A-Za-z0-9_-]+)\b/i)
  if (legacyMatch && legacyMatch[1]) {
    return legacyMatch[1].toUpperCase()
  }

  // Pattern 3: Generic CERT format
  const certMatch = decoded.match(/\b(CERT-[A-Za-z0-9_-]+)\b/i)
  if (certMatch && certMatch[1]) {
    return certMatch[1].toUpperCase()
  }

  // Pattern 4: Check if string has query parameters inside it
  if (decoded.includes('?')) {
    try {
      const queryStr = decoded.slice(decoded.indexOf('?') + 1).split('#')[0]
      const params = new URLSearchParams(queryStr)
      for (const [, val] of params.entries()) {
        const nested = extractCertIdFromString(val)
        if (nested) return nested
      }
    } catch {
      // ignore query parsing errors
    }
  }

  // Pattern 5: URL path segment extraction (/verify/certificate/AUS543444)
  const cleanPath = decoded.split('?')[0].split('#')[0].replace(/\/+$/, '')
  const lastSlash = cleanPath.lastIndexOf('/')
  if (lastSlash >= 0 && lastSlash < cleanPath.length - 1) {
    const segment = cleanPath.substring(lastSlash + 1).trim()
    const segMatch = segment.match(/\b(AUS\d{5,8})\b/i)
    if (segMatch) return segMatch[1].toUpperCase()
    if (/^[A-Za-z0-9_-]{5,40}$/.test(segment)) {
      return segment.toUpperCase()
    }
  }

  return /^[A-Za-z0-9_-]{5,40}$/.test(decoded) ? decoded.toUpperCase() : decoded
}

/**
 * Extracts a Fee Receipt or Challan Number from raw input or URLSearchParams
 */
export function resolveFeeReceiptNumber(input, searchParams = null) {
  if (searchParams && typeof searchParams.get === 'function') {
    const keys = [
      'url', 'receiptNumber', 'receipt_number', 'number', 'id',
      'ref', 'target', 'receipt', 'q', 'code', 'tx', 'txn'
    ]
    for (const key of keys) {
      const val = searchParams.get(key)
      if (val) {
        const extracted = extractFeeReceiptFromString(val)
        if (extracted) return extracted
      }
    }
  }

  return extractFeeReceiptFromString(input)
}

function extractFeeReceiptFromString(raw) {
  if (!raw || typeof raw !== 'string') return ''
  const decoded = deepUrlDecode(raw)

  // Pattern 1: AU-FEE format (e.g. AU-FEE-2026-25546)
  const feeMatch = decoded.match(/\b(AU-FEE-[A-Za-z0-9_-]+)\b/i)
  if (feeMatch && feeMatch[1]) {
    return feeMatch[1].toUpperCase()
  }

  // Pattern 2: Challan format (e.g. SBI-CHALLAN-998877)
  const challanMatch = decoded.match(/\b([A-Z]{2,6}-CHALLAN-[A-Za-z0-9_-]+)\b/i)
  if (challanMatch && challanMatch[1]) {
    return challanMatch[1].toUpperCase()
  }

  // Pattern 3: Generic REC- format
  const recMatch = decoded.match(/\b(REC-[A-Za-z0-9_-]+)\b/i)
  if (recMatch && recMatch[1]) {
    return recMatch[1].toUpperCase()
  }

  // Pattern 4: Query parameter parsing inside string
  if (decoded.includes('?')) {
    try {
      const queryStr = decoded.slice(decoded.indexOf('?') + 1).split('#')[0]
      const params = new URLSearchParams(queryStr)
      for (const [, val] of params.entries()) {
        const nested = extractFeeReceiptFromString(val)
        if (nested) return nested
      }
    } catch {
      // ignore
    }
  }

  // Pattern 5: URL path segment extraction
  const cleanPath = decoded.split('?')[0].split('#')[0].replace(/\/+$/, '')
  const lastSlash = cleanPath.lastIndexOf('/')
  if (lastSlash >= 0 && lastSlash < cleanPath.length - 1) {
    const segment = cleanPath.substring(lastSlash + 1).trim()
    const segMatch = segment.match(/\b(AU-FEE-[A-Za-z0-9_-]+)\b/i)
    if (segMatch) return segMatch[1].toUpperCase()
    if (/^[A-Za-z0-9_-]{6,50}$/.test(segment)) {
      return segment.toUpperCase()
    }
  }

  return /^[A-Za-z0-9_-]{6,50}$/.test(decoded) ? decoded.toUpperCase() : decoded
}
