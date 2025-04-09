// Client-side profanity filter
// This is a simplified version of the server-side filter for use in the browser

// Common bad words list (simplified for client-side)
const commonBadWords = [
  "badword1",
  "badword2", // Replace with actual words
  // Add a subset of common bad words here
];

// Leet speak mapping
const leetMap: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "8": "b",
  "@": "a",
  $: "s",
};

/**
 * Client-side check for profanity
 * Note: This is not as comprehensive as the server-side check
 * and should be used only for immediate feedback
 */
export function clientContainsProfanity(text: string): boolean {
  if (!text) return false;

  const lowerText = text.toLowerCase();

  // Direct check
  if (commonBadWords.some((word) => lowerText.includes(word))) {
    return true;
  }

  // Check without spaces
  const noSpacesText = lowerText.replace(/[\s_\-\.]/g, "");
  if (commonBadWords.some((word) => noSpacesText.includes(word))) {
    return true;
  }

  // Check leet speak variations
  let normalizedText = lowerText;
  for (const [leet, normal] of Object.entries(leetMap)) {
    normalizedText = normalizedText.replace(new RegExp(leet, "g"), normal);
  }

  if (commonBadWords.some((word) => normalizedText.includes(word))) {
    return true;
  }

  return false;
}
