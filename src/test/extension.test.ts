import * as assert from "assert";
import * as fs from "fs";
import path from "path";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { loadSessionHistory, saveSessionHistory } from "../extension";
import { WorkSession } from "../workhours/WorkSession";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
});
suite("Session History", () => {
  const tempFilePath = path.join(__dirname, "temp-session-history.json");
  let sessionHistory: WorkSession[] = [
    new WorkSession("Session 1", "Project A"),
    new WorkSession("Session 2", "Project B"),
  ];
  sessionHistory[0].startTime = new Date("2024-12-03T08:00:00.000Z");
  sessionHistory[0].endTime = new Date("2024-12-03T10:00:00.000Z");
  sessionHistory[1].startTime = new Date("2024-12-03T11:00:00.000Z");
  sessionHistory[1].endTime = new Date("2024-12-03T13:00:00.000Z");

  test("should save session history to a file", () => {
    saveSessionHistory(sessionHistory, tempFilePath);
    const savedData = JSON.parse(fs.readFileSync(tempFilePath, "utf8"));
    assert.strictEqual(savedData.length, 2);
    assert.strictEqual(savedData[0].description, "Session 1");
    assert.strictEqual(savedData[1].description, "Session 2");
  });

  test("should load session history from a file", () => {
    saveSessionHistory(sessionHistory, tempFilePath);
    let newHistory = loadSessionHistory(tempFilePath);
    assert.strictEqual(newHistory.length, 2);
    assert.ok(newHistory[0] instanceof WorkSession);
    assert.ok(newHistory[1] instanceof WorkSession);
    assert.strictEqual(newHistory[0].description, "Session 1");
    assert.strictEqual(newHistory[1].description, "Session 2");
  });

  test("should correctly revive startTime and endTime as Date objects", () => {
    saveSessionHistory(sessionHistory, tempFilePath);
    let newHistory = loadSessionHistory(tempFilePath);
    assert.ok(newHistory[0].startTime instanceof Date);
    assert.ok(newHistory[0].endTime instanceof Date);
    assert.strictEqual(
      newHistory[0].startTime?.toISOString(),
      "2024-12-03T08:00:00.000Z",
    );
    assert.strictEqual(
      newHistory[0].endTime?.toISOString(),
      "2024-12-03T10:00:00.000Z",
    );
  });
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
});
