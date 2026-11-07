import test from "node:test";
import assert from "node:assert/strict";
import { insertEventSchema } from "../shared/schema";
import { eventSaveError } from "./event-errors";

test("events accept turning featured off without changing publication", () => {
  const payload = insertEventSchema.partial().parse({
    title: "Exhibition", startDate: "2026-11-07",
    endDate: null, websiteUrl: null, imageUrl: null,
    isPublished: true, isFeatured: false,
  });
  assert.equal(payload.isFeatured, false);
  assert.equal(payload.isPublished, true);
});

test("read-only database failures are not reported as invalid event data", () => {
  for (const error of [{ code: "25006" }, { cause: { code: "25006" } }]) {
    const failure = eventSaveError(error);
    assert.equal(failure.status, 503);
    assert.match(failure.message, /read-only/);
    assert.match(failure.message, /not saved/);
  }
});

test("validation failures and unexpected server errors remain distinct", () => {
  const result = insertEventSchema.safeParse({ title: 123 });
  assert.equal(result.success, false);
  if (!result.success) assert.equal(eventSaveError(result.error).status, 400);
  assert.equal(eventSaveError(new Error("internal details")).status, 500);
  assert.equal(eventSaveError(null).status, 500);
});
