declare module "leo-profanity";

import LeoProfanity from "leo-profanity";

// Initialize the filter
const filter = LeoProfanity;

// Add English dictionary
filter.loadDictionary("en");

// Add additional custom words
filter.add([
  "b00bs",
  "b0obs",
  "bo0bs",
  "booobs",
  "b00b5",
  // Add more variations as needed
]);

/**
 * Checks if text contains profanity
 * @param text Text to check for profanity
 * @returns True if profanity is found, false otherwise
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;

  // Convert to lowercase for better matching
  const lowerText = text.toLowerCase();

  // Check original text
  if (filter.check(lowerText)) return true;

  // Check for spaces or special characters used to bypass filter
  const noSpacesText = lowerText.replace(/[\s_\-\.]/g, "");
  if (filter.check(noSpacesText)) return true;

  // Check for leet speak variations
  const leetVariations = [
    lowerText.replace(/0/g, "o"),
    lowerText.replace(/1/g, "i"),
    lowerText.replace(/3/g, "e"),
    lowerText.replace(/4/g, "a"),
    lowerText.replace(/5/g, "s"),
    lowerText.replace(/8/g, "b"),
    lowerText.replace(/@/g, "a"),
    lowerText.replace(/\$/g, "s"),
  ];

  for (const variation of leetVariations) {
    if (filter.check(variation)) return true;
  }

  return false;
}

/**
 * Cleans text by replacing profanity with asterisks
 * @param text Text to clean
 * @returns Cleaned text with profanity replaced by asterisks
 */
export function cleanText(text: string): string {
  if (!text) return "";
  return filter.clean(text);
}
