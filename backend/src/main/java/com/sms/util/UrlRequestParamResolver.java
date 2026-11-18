package com.sms.util;

import lombok.extern.slf4j.Slf4j;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Enterprise URL & Request Parameter Resolver.
 * Robustly parses and extracts canonical entity identifiers (Certificate IDs, Fee Receipts,
 * Challan references, Transaction IDs) from diverse scanner outputs, query strings,
 * encoded URLs, path fragments, and messy user inputs.
 */
@Slf4j
public final class UrlRequestParamResolver {

    private UrlRequestParamResolver() {}

    // Regex Patterns
    private static final Pattern AUS_CERT_PATTERN = Pattern.compile("(?i)\\b(AUS\\d{5,8})\\b");
    private static final Pattern LEGACY_CERT_PATTERN = Pattern.compile("(?i)\\b(AU-SIS-[A-Za-z0-9_-]+)\\b");
    private static final Pattern GENERIC_CERT_PATTERN = Pattern.compile("(?i)\\b(CERT-[A-Za-z0-9_-]+)\\b");

    private static final Pattern FEE_RECEIPT_PATTERN = Pattern.compile("(?i)\\b(AU-FEE-[A-Za-z0-9_-]+)\\b");
    private static final Pattern CHALLAN_PATTERN = Pattern.compile("(?i)\\b([A-Z]{2,6}-CHALLAN-[A-Za-z0-9_-]+)\\b");
    private static final Pattern GENERIC_FEE_PATTERN = Pattern.compile("(?i)\\b(REC-[A-Za-z0-9_-]+)\\b");
    private static final Pattern ORDER_PAYMENT_PATTERN = Pattern.compile("(?i)\\b(AU_ORD_[A-Za-z0-9_-]+|order_[A-Za-z0-9_-]+|pay_[A-Za-z0-9_-]+)\\b");

    /**
     * Recursively decodes a string up to 3 times to unwrap single, double, or triple percent-encoded URLs.
     */
    public static String deepUrlDecode(String input) {
        if (input == null) return null;
        String current = input.trim();
        // Remove zero-width spaces, BOM, and control characters
        current = current.replaceAll("[\\u200B-\\u200D\\uFEFF]", "");
        // Strip outer quotes if any
        if ((current.startsWith("\"") && current.endsWith("\"")) || (current.startsWith("'") && current.endsWith("'"))) {
            current = current.substring(1, current.length() - 1).trim();
        }

        for (int i = 0; i < 3; i++) {
            if (current.contains("%") || current.contains("+")) {
                try {
                    String decoded = URLDecoder.decode(current, StandardCharsets.UTF_8);
                    if (decoded.equals(current)) break;
                    current = decoded;
                } catch (Exception e) {
                    break;
                }
            } else {
                break;
            }
        }
        return current.trim();
    }

    /**
     * Resolves a Certificate Identifier from an input string or query map.
     */
    public static String resolveCertificateId(String directInput, Map<String, String> allParams) {
        // 1. Check direct input first
        if (directInput != null && !directInput.isBlank()) {
            String extracted = extractCertificateId(directInput);
            if (extracted != null && !extracted.isBlank()) return extracted;
        }

        // 2. Inspect query parameters with prioritized keys
        if (allParams != null && !allParams.isEmpty()) {
            String[] priorityKeys = {
                "url", "id", "certificateId", "certificate_id", "certId", "cert_id",
                "code", "target", "q", "ref", "cert", "number"
            };
            for (String key : priorityKeys) {
                for (Map.Entry<String, String> entry : allParams.entrySet()) {
                    if (entry.getKey().equalsIgnoreCase(key) && entry.getValue() != null && !entry.getValue().isBlank()) {
                        String extracted = extractCertificateId(entry.getValue());
                        if (extracted != null && !extracted.isBlank()) return extracted;
                    }
                }
            }

            // 3. Fallback: inspect every query parameter value
            for (String val : allParams.values()) {
                if (val != null && !val.isBlank()) {
                    String extracted = extractCertificateId(val);
                    if (extracted != null && !extracted.isBlank()) return extracted;
                }
            }
        }

        return directInput != null ? directInput.trim() : "";
    }

    /**
     * Extracts canonical Certificate ID from raw string, full URL, or scanner payload.
     */
    public static String extractCertificateId(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String decoded = deepUrlDecode(raw);

        // A. Match AUS###### format
        Matcher aus = AUS_CERT_PATTERN.matcher(decoded);
        if (aus.find()) {
            return aus.group(1).toUpperCase();
        }

        // B. Match AU-SIS legacy format
        Matcher legacy = LEGACY_CERT_PATTERN.matcher(decoded);
        if (legacy.find()) {
            return legacy.group(1).toUpperCase();
        }

        // C. Match generic CERT- format
        Matcher gen = GENERIC_CERT_PATTERN.matcher(decoded);
        if (gen.find()) {
            return gen.group(1).toUpperCase();
        }

        // D. Inspect nested query parameters within decoded URL
        if (decoded.contains("?")) {
            String queryPart = decoded.substring(decoded.indexOf('?') + 1);
            int hashIndex = queryPart.indexOf('#');
            if (hashIndex >= 0) queryPart = queryPart.substring(0, hashIndex);

            for (String pair : queryPart.split("&")) {
                String[] kv = pair.split("=", 2);
                if (kv.length == 2) {
                    String val = deepUrlDecode(kv[1]);
                    String nested = extractCertificateId(val);
                    if (nested != null && !nested.isBlank()) return nested;
                }
            }
        }

        // E. Path segment extraction from URL
        String path = decoded;
        if (path.contains("?")) path = path.substring(0, path.indexOf('?'));
        if (path.contains("#")) path = path.substring(0, path.indexOf('#'));
        path = path.replaceAll("/+$", "");

        int lastSlash = path.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash < path.length() - 1) {
            String lastSegment = path.substring(lastSlash + 1).trim();
            // Check if last segment has pattern
            Matcher m = AUS_CERT_PATTERN.matcher(lastSegment);
            if (m.find()) return m.group(1).toUpperCase();
            if (lastSegment.matches("(?i)[a-z0-9_-]{5,40}")) {
                return lastSegment.toUpperCase();
            }
        }

        return decoded.trim();
    }

    /**
     * Resolves a Fee Receipt or Transaction Identifier from an input string or query map.
     */
    public static String resolveFeeReceiptNumber(String directInput, Map<String, String> allParams) {
        // 1. Check direct input first
        if (directInput != null && !directInput.isBlank()) {
            String extracted = extractFeeReceiptNumber(directInput);
            if (extracted != null && !extracted.isBlank()) return extracted;
        }

        // 2. Inspect query parameters with prioritized keys
        if (allParams != null && !allParams.isEmpty()) {
            String[] priorityKeys = {
                "url", "number", "receiptNumber", "receipt_number", "receipt",
                "id", "ref", "target", "q", "code", "tx", "txn", "orderId", "paymentId"
            };
            for (String key : priorityKeys) {
                for (Map.Entry<String, String> entry : allParams.entrySet()) {
                    if (entry.getKey().equalsIgnoreCase(key) && entry.getValue() != null && !entry.getValue().isBlank()) {
                        String extracted = extractFeeReceiptNumber(entry.getValue());
                        if (extracted != null && !extracted.isBlank()) return extracted;
                    }
                }
            }

            // 3. Fallback: inspect all values
            for (String val : allParams.values()) {
                if (val != null && !val.isBlank()) {
                    String extracted = extractFeeReceiptNumber(val);
                    if (extracted != null && !extracted.isBlank()) return extracted;
                }
            }
        }

        return directInput != null ? directInput.trim() : "";
    }

    /**
     * Extracts canonical Fee Receipt / Challan reference from raw string or URL.
     */
    public static String extractFeeReceiptNumber(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String decoded = deepUrlDecode(raw);

        // A. Match AU-FEE- format
        Matcher fee = FEE_RECEIPT_PATTERN.matcher(decoded);
        if (fee.find()) {
            return fee.group(1).toUpperCase();
        }

        // B. Match Challan format (e.g. SBI-CHALLAN-998877)
        Matcher challan = CHALLAN_PATTERN.matcher(decoded);
        if (challan.find()) {
            return challan.group(1).toUpperCase();
        }

        // C. Match REC- format
        Matcher gen = GENERIC_FEE_PATTERN.matcher(decoded);
        if (gen.find()) {
            return gen.group(1).toUpperCase();
        }

        // D. Match Order / Payment format
        Matcher ord = ORDER_PAYMENT_PATTERN.matcher(decoded);
        if (ord.find()) {
            return ord.group(1);
        }

        // E. Inspect nested query parameters
        if (decoded.contains("?")) {
            String queryPart = decoded.substring(decoded.indexOf('?') + 1);
            int hashIndex = queryPart.indexOf('#');
            if (hashIndex >= 0) queryPart = queryPart.substring(0, hashIndex);

            for (String pair : queryPart.split("&")) {
                String[] kv = pair.split("=", 2);
                if (kv.length == 2) {
                    String val = deepUrlDecode(kv[1]);
                    String nested = extractFeeReceiptNumber(val);
                    if (nested != null && !nested.isBlank()) return nested;
                }
            }
        }

        // F. Path segment extraction
        String path = decoded;
        if (path.contains("?")) path = path.substring(0, path.indexOf('?'));
        if (path.contains("#")) path = path.substring(0, path.indexOf('#'));
        path = path.replaceAll("/+$", "");

        int lastSlash = path.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash < path.length() - 1) {
            String lastSegment = path.substring(lastSlash + 1).trim();
            Matcher m = FEE_RECEIPT_PATTERN.matcher(lastSegment);
            if (m.find()) return m.group(1).toUpperCase();
            if (lastSegment.matches("(?i)[a-z0-9_-]{6,50}")) {
                return lastSegment.toUpperCase();
            }
        }

        return decoded.trim();
    }
}
