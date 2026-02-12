export function sanitizeSourceText(text: string, maxChars: number = 16000): string {
    if (!text) return "";
    let clean = text.trim();
    if (clean.length > maxChars) {
        clean = clean.substring(0, maxChars) + "\n\n[TRUNCATED]";
    }
    return clean;
}
