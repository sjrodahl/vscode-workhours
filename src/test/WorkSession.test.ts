import { mergeWorkSessions, WorkSession } from "../workhours/WorkSession";
import assert, { strictEqual } from "assert";

suite("WorkSession Class", () => {
  test("should return correct duration when startTime and endTime are provided", () => {
    const startTime = new Date("2024-12-03T08:00:00.000Z");
    const endTime = new Date("2024-12-03T10:00:00.000Z");
    const session = new WorkSession("Test Session");
    session.startTime = startTime;
    session.endTime = endTime;
    assert.strictEqual(session.getDuration(), 2);
  });

  test("should return 0 when startTime is not provided", () => {
    const session = new WorkSession("Test Session");
    assert.strictEqual(session.getDuration(), 0);
  });

  test("should return correct duration when session is in progress", () => {
    const session = new WorkSession("Test Session");
    session.start();
    const now = new Date();
    const duration =
      (now.getTime() - session.startTime!.getTime()) / (1000 * 60 * 60);
    assert.ok(Math.abs(session.getDuration() - duration) < 1);
  });

  test("should start a new session with the start method", () => {
    const session = new WorkSession("Test Session");
    session.start();
    assert.ok(session.startTime !== undefined);
  });

  test("should not start a new session if one is already started", () => {
    const session = new WorkSession("Test Session");
    session.start();
    const firstStartTime = session.startTime;
    session.start();
    assert.strictEqual(session.startTime, firstStartTime);
  });

  test("should stop the session with the stop method", () => {
    const session = new WorkSession("Test Session");
    session.start();
    session.stop();
    assert.ok(session.endTime !== undefined);
  });

  test("should calculate the duration of the current session even if not stopped", () => {
    const session = new WorkSession("Test Session");
    session.start();
    const now = new Date();
    const duration =
      (now.getTime() - session.startTime!.getTime()) / (1000 * 60 * 60);
    assert.ok(Math.abs(session.getDuration() - duration) < 1);
  });

  test("should allow optional project tag and description", () => {
    const session = new WorkSession("Test Session with Project", "Project Tag");
    session.start();
    assert.strictEqual(session.description, "Test Session with Project");
    assert.strictEqual(session.projectTag, "Project Tag");
  });
  test("should be JSONstringify-able", () => {
    let session = new WorkSession("desc", "proj");
    assert.strictEqual(
      JSON.stringify(session),
      '{"description":"desc","projectTag":"proj"}',
    );
    session.startTime = new Date("2024-12-03T08:00:00.000Z");
    session.endTime = new Date("2024-12-03T10:00:00.000Z");
    assert.strictEqual(
      JSON.stringify(session),
      '{"description":"desc","endTime":"2024-12-03T10:00:00.000Z","startTime":"2024-12-03T08:00:00.000Z","projectTag":"proj"}',
    );
  });

  test("should merge sessions with the same date and projectTag", () => {
    const session1 = new WorkSession("Session 1", "Project A");
    session1.startTime = new Date("2024-12-03T08:00:00.000Z");
    session1.endTime = new Date("2024-12-03T10:00:00.000Z");

    const session2 = new WorkSession("Session 2", "Project A");
    session2.startTime = new Date("2024-12-03T11:00:00.000Z");
    session2.endTime = new Date("2024-12-03T13:00:00.000Z");

    const session3 = new WorkSession("Session 3", "Project B");
    session3.startTime = new Date("2024-12-03T08:00:00.000Z");
    session3.endTime = new Date("2024-12-03T10:00:00.000Z");

    const ongoingSession = new WorkSession(
      "Ongoing sessions should not be merged",
      "Project A",
    );
    ongoingSession.startTime = new Date("2024-12-03T08:00:00.000Z");

    const noProjectSession = new WorkSession(
      "Session with no project should not be merged",
    );
    noProjectSession.startTime = new Date("2024-12-03T14:00:00.000Z");
    noProjectSession.endTime = new Date("2024-12-03T15:00:00.000Z");

    const mergedSessions = mergeWorkSessions([
      session1,
      session2,
      session3,
      ongoingSession,
      noProjectSession,
    ]);

    assert.strictEqual(mergedSessions.length, 4);

    const mergedSession = mergedSessions.find(
      (s) => s.projectTag === "Project A",
    );
    assert.ok(mergedSession);
    assert.strictEqual(mergedSession.description, "Session 1. Session 2");
    assert.strictEqual(
      mergedSession.startTime?.toISOString(),
      "2024-12-03T08:00:00.000Z",
    );
    assert.strictEqual(
      mergedSession.endTime?.toISOString(),
      "2024-12-03T13:00:00.000Z",
    );
    assert.strictEqual(mergedSession.duration, 4);
  });
});
