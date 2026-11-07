import { z } from "zod";

export function eventSaveError(error: unknown) {
  if (error instanceof z.ZodError) {
    return { status: 400, message: "Invalid event data" };
  }
  // Drizzle may wrap the original PostgreSQL error as its cause.
  const databaseError = error as { code?: string; cause?: { code?: string } } | null;
  if (databaseError?.code === "25006" || databaseError?.cause?.code === "25006") {
    return {
      status: 503,
      message: "The database is currently read-only. Your event was not saved. Restore write access in Supabase, then try again.",
    };
  }
  return { status: 500, message: "Unable to save event. Please try again." };
}
