export function findMatchReplaceAll(str: string, findStr: string, replaceStr: string): string {
  let result = "";
  let position = str.indexOf(findStr);
  let currentIndex = 0;

  // Loop through the string and find each match
  while (position !== -1) {
    // Add the part before the match, and the replaced part
    result += str.substring(currentIndex, position) + replaceStr;
    currentIndex = position + findStr.length;

    // Find the next occurrence
    position = str.indexOf(findStr, currentIndex);
  }

  // Add the remaining part of the string after the last match
  result += str.substring(currentIndex);

  return result;
}

export function extractMentions(str: string): string[] {
  const regex = /@\w+/g; // Match strings that start with @ followed by word characters
  const matches = str.match(regex);

  return matches || []; // Return all matches, or an empty array if none found
}

export function sanitizeMessage(message: string): string {
  // Remove invisible and potentially problematic Unicode characters
  const invisibleCharsRegex =
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u001F\u007F-\u009F\u00AD\u061C\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u2069\uFEFF]/g;

  // Remove zero-width characters
  const zeroWidthCharsRegex = /[\u200B-\u200D\uFEFF]/g;

  // Remove control characters
  // eslint-disable-next-line no-control-regex
  const controlCharsRegex = /[\u0000-\u001F\u007F-\u009F]/g;

  // Normalize whitespace (replace multiple spaces with a single space)
  const multipleSpacesRegex = /\s+/g;

  // Perform the sanitization
  return message
    .replace(invisibleCharsRegex, "")
    .replace(zeroWidthCharsRegex, "")
    .replace(controlCharsRegex, "")
    .replace(multipleSpacesRegex, " ")
    .trim();
}

