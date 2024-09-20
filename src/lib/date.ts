import { Timestamp } from "@google-cloud/firestore";

export function serverTimestampToDate(timestamp: Timestamp): Date | null {
  return timestamp instanceof Timestamp ? timestamp.toDate() : null;
}
