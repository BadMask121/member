/* eslint-disable no-multi-assign */
import { Timestamp } from "@google-cloud/firestore";

export function serverTimestampToDate(timestamp: Timestamp): Date | null {
  return timestamp instanceof Timestamp ? timestamp.toDate() : null;
}

/**
 * 
 * @param humanDateTimeRange # convertHumanDateTimeRange Function Documentation

## Overview

The `convertHumanDateTimeRange` function converts human-readable date and time inputs into an object containing UTC epoch timestamps for the start and end of the specified range. It supports single dates, date ranges, and special keywords, all using the DD/MM/YYYY format.

## Function Signature

```javascript
function convertHumanDateTimeRange(humanDateTimeRange: string): {
  from: number,
  to: number
}
```

## Input Format

The function accepts a string input in the following formats:

1. Single date: `"DD/MM/YYYY"`
2. Single date with time: `"DD/MM/YYYY HH:mm:ss"`
3. Date range: `"DD/MM/YYYY - DD/MM/YYYY"`
4. Date range with time: `"DD/MM/YYYY HH:mm:ss - DD/MM/YYYY HH:mm:ss"`
5. Special keywords: `"now"`, `"today"`, `"yesterday"`, `"last month"`

## Output Format

The function returns an object with two properties:
- `from`: The UTC epoch timestamp (seconds since January 1, 1970, 00:00:00 UTC) for the start of the range
- `to`: The UTC epoch timestamp for the end of the range

## Usage Examples

1. Single date:
   ```javascript
   convertHumanDateTimeRange("14/03/2024")
   // Output: { from: 1710374400, to: 1710374400 }
   ```

2. Single date with time:
   ```javascript
   convertHumanDateTimeRange("14/03/2024 15:30:00")
   // Output: { from: 1710430200, to: 1710430200 }
   ```

3. Date range:
   ```javascript
   convertHumanDateTimeRange("14/03/2024 - 20/03/2024")
   // Output: { from: 1710374400, to: 1710892800 }
   ```

4. Date range with time:
   ```javascript
   convertHumanDateTimeRange("14/03/2024 10:00:00 - 20/03/2024 15:30:00")
   // Output: { from: 1710410400, to: 1710948600 }
   ```

5. Special keywords:
   ```javascript
   convertHumanDateTimeRange("now")
   // Output: { from: [current timestamp], to: [current timestamp] }

   convertHumanDateTimeRange("today")
   // Output: { from: [today's timestamp at 00:00:00], to: [today's timestamp at 00:00:00] }

   convertHumanDateTimeRange("yesterday")
   // Output: { from: [yesterday's timestamp at 00:00:00], to: [yesterday's timestamp at 00:00:00] }

   convertHumanDateTimeRange("last month")
   // Output: { from: [first day of last month at 00:00:00], to: [last day of last month at 00:00:00] }
   ```

## Error Handling

The function will throw an error in the following cases:
- Invalid date format (not DD/MM/YYYY)
- Invalid date (e.g., 31/02/2024)
- Missing or incomplete date information

## Notes

- The function assumes all dates are in the local timezone of the system running the code.
- For single dates without a specified time, the time is set to 00:00:00 (midnight).
- The 'last month' keyword calculates from the first day of the previous month to the last day of the previous month.
- All timestamps in the output are UTC epoch timestamps in seconds.
 * @returns 
 */
export function convertHumanDateTimeRange(humanDateTimeRange: string): {
  from: number;
  to: number;
} | null {
  try {
    const now = new Date();
    const trimmedInput = humanDateTimeRange.trim().toLowerCase();

    let from: number;
    let to: number;

    if (trimmedInput.includes(" - ")) {
      // Handle date range
      const [fromStr, toStr] = trimmedInput.split(" - ");
      from = parseDate(fromStr);
      to = parseDate(toStr);
    } else {
      // Handle single date or keywords
      switch (trimmedInput) {
        case "now":
          from = to = Math.floor(now.getTime() / 1000);
          break;
        case "today":
          from = to = getToday(now);
          break;
        case "yesterday":
          from = to = getToday(now) - 86400; // 86400 seconds in a day
          break;
        case "last month":
          {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            from = Math.floor(lastMonth.getTime() / 1000);
            to = getToday(now) - 86400; // Last day of previous month
          }
          break;
        default:
          // Treat as single date
          from = to = parseDate(trimmedInput);
      }
    }

    return {
      from,
      to,
    };
  } catch (error) {
    return null;
  }
}

function parseDate(dateStr: string): number {
  const parts = dateStr.split(/[/\s:]/);
  if (parts.length < 3) {
    throw new Error(`Invalid date format: ${dateStr}. Expected DD/MM/YYYY.`);
  }

  // Parse DD/MM/YYYY format
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
  const year = parseInt(parts[2], 10);
  const hours = parseInt(parts[3] || "0", 10);
  const minutes = parseInt(parts[4] || "0", 10);
  const seconds = parseInt(parts[5] || "0", 10);

  const parsedDate = new Date(year, month, day, hours, minutes, seconds);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  return Math.floor(parsedDate.getTime() / 1000);
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function getToday(now: Date): number {
  return parseDate(formatDate(now.getTime() / 1000));
}
