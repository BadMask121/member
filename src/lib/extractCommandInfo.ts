import { Command } from "../entities/Command";

interface CommandInfo {
  mention: string;
  command: Command | null; // command is null if not provided
  action: string | null; // timeframe is null if not provided
}

export function extractCommandInfo(message: string): CommandInfo | null {
  // Regular expression to match the pattern: @mention [/command] [timeframe]
  // Both the command and timeframe are now optional in this pattern
  const regex = /^(@\+?\d+)(?:\s+(\/\w+))?(?:\s+(.+))?$/;

  const match = message.match(regex);

  if (match) {
    return {
      mention: match[1],
      command: (match[2]?.replace("/", "") as Command) || null, // command is null if not provided
      action: match[3] || null, // timeframe is null if not provided
    };
  }

  return null; // Return null if the pattern doesn't match
}
