// Define the leetMap with a proper index signature
const leetMap: { [key: string]: string } = {
  "0": "O",
  "1": "I",
  "2": "Z",
  "3": "E",
  "4": "A",
  "5": "S",
  "6": "G",
  "7": "T",
  "8": "B",
  "9": "g",
  "@": "a",
  $: "s",
  "+": "t",
  "!": "i",
  "*": "x",
  "(": "c",
  ")": "o",
  // Add any other mappings you have
};

/**
 * Converts text to leet speak
 */
export function toLeet(text: string): string {
  return text
    .split("")
    .map((char) => leetMap[char] || char)
    .join("");
}

// Generate possible variations of a text with leet speak
function getPossibleVariations(text: string): string[] {
  const variations = [text];

  // Convert the entire text from leet to normal
  variations.push(toLeet(text));

  // Generate more sophisticated variations if needed
  // This is a simplified approach - a more comprehensive solution would
  // generate all possible combinations of leet and normal characters

  return variations;
}

export const leet = {
  toLeet,
  getPossibleVariations,
};
