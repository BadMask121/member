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
