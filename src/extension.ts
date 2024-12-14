import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { mergeWorkSessions, WorkSession } from "./workhours/WorkSession";

let currentSession: WorkSession | null = null;
let storageFilePath: string;
let sessionHistory: WorkSession[] = [];
let statusBarItem: vscode.StatusBarItem;
let statusBarInterval: NodeJS.Timeout | null = null;

let currentProject: string | undefined;
const PROJECTS: string[] = [
  "Solwr Robotics AS**: 1145: R&D Grab 2024: Picking operations and gripper/tool changer design",
  "Solwr Robotics AS**: 1145: R&D Grab 2024: Design and operation improvements for scaling",
  "Solwr Robotics AS**: 1147: R&D Sort 2024",
  "Solwr Robotics AS: 2022999: R&D OWL - Optimization and learning for Warehouse Logistics: WP2 Adaptation and improvement of SotA",
];

export function activate(context: vscode.ExtensionContext) {
  storageFilePath = path.join(
    context.globalStorageUri.fsPath,
    "workhours.json",
  );

  // Ensure the storage directory exists
  if (!fs.existsSync(context.globalStorageUri.fsPath)) {
    fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
  }

  // Load existing time data
  sessionHistory = loadSessionHistory(storageFilePath);

  currentProject = vscode.workspace
    .getConfiguration("workhours")
    .get<string>("defaultProject");

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.text = getStatusBarText();
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Start interval to update status bar every second
  statusBarInterval = setInterval(updateStatusBar, 1000);
  context.subscriptions.push({
    dispose: () => statusBarInterval && clearInterval(statusBarInterval),
  });

  const startCommand = vscode.commands.registerCommand(
    "workhours.start",
    () => {
      if (!currentSession) {
        currentSession = new WorkSession("Coding session", currentProject);
        currentSession.start();
        vscode.window.showInformationMessage("Time tracking started!");
      } else {
        vscode.window.showInformationMessage(
          "A session is already in progress.",
        );
      }
    },
  );

  const stopCommand = vscode.commands.registerCommand("workhours.stop", () => {
    if (currentSession) {
      currentSession.stop();
      sessionHistory.push(currentSession);
      saveSessionHistory(sessionHistory, storageFilePath);
      vscode.window.showInformationMessage(
        `Time tracking stopped. Total time: ${currentSession.getDuration().toFixed(2)} hours.`,
      );
      currentSession = null;
    } else {
      vscode.window.showInformationMessage(
        "No session is currently in progress.",
      );
    }
  });

  const showCommand = vscode.commands.registerCommand("workhours.show", () => {
    vscode.window.showInformationMessage(
      `${sessionHistory.length} sessions in history.`,
    );
    if (currentSession) {
      vscode.window.showInformationMessage(
        `Current session duration: ${currentSession.getDuration().toFixed(2)} hours.`,
      );
    } else {
      vscode.window.showInformationMessage(
        "No session is currently in progress.",
      );
    }
  });

  const selectProjectCommand = vscode.commands.registerCommand(
    "workhours.selectProject",
    () => {
      vscode.window
        .showQuickPick(PROJECTS, {
          placeHolder: "Select a project to track time under",
        })
        .then((project) => {
          if (project) {
            currentProject = project;
          }
          if (project && currentSession) {
            currentSession.projectTag = project;
            vscode.window.showInformationMessage(
              `Current project set to: ${project}`,
            );
            updateStatusBar();
          }
        });
    },
  );

  const setCurrentProjectAsDefaultCommand = vscode.commands.registerCommand(
    "workhours.setCurrentProjectAsDefault",
    () => {
      vscode.workspace
        .getConfiguration("workhours")
        .update("defaultProject", currentProject);
    },
  );

  const editCommand = vscode.commands.registerCommand("workhours.edit", () => {
    if (fs.existsSync(storageFilePath)) {
      vscode.workspace.openTextDocument(storageFilePath).then((doc) => {
        vscode.window.showTextDocument(doc);
      });
    } else {
      vscode.window.showInformationMessage("No work hours file found to edit.");
    }
  });

  const summarizeCommand = vscode.commands.registerCommand(
    "workhours.summarize",
    saveHistorySummarized,
  );

  context.subscriptions.push(
    startCommand,
    stopCommand,
    showCommand,
    selectProjectCommand,
    setCurrentProjectAsDefaultCommand,
    editCommand,
    summarizeCommand,
  );
}

export function deactivate() {
  if (currentSession) {
    currentSession.stop();
    saveSessionHistory(sessionHistory, storageFilePath);
  }
  if (statusBarInterval) {
    clearInterval(statusBarInterval);
  }
}

const updateStatusBar = () => {
  if (statusBarItem) {
    statusBarItem.text = getStatusBarText();
    statusBarItem.show();
  }
};

const getStatusBarText = (): string => {
  if (currentSession) {
    const projectText = currentSession.projectTag
      ? `Project: ${currentSession.projectTag} | `
      : "";
    const timeText = `Current Session: ${currentSession.getDuration().toFixed(2)} hrs`;
    return `${projectText}${timeText}`;
  }
  return "No active session";
};

function reviveDate(key: string, value: any) {
  // Matches strings like "2022-08-25T09:39:19.288Z"
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  return typeof value === "string" && isoDateRegex.test(value)
    ? new Date(value)
    : value;
}

export function loadSessionHistory(path: string): WorkSession[] {
  let sessions: WorkSession[] = [];
  if (fs.existsSync(path)) {
    try {
      const data = fs.readFileSync(path, "utf8");
      let json = JSON.parse(data, reviveDate);
      sessions = json.map(
        (it: any) =>
          new WorkSession(
            it.description,
            it.projectTag,
            it.startTime,
            it.endTime,
            it.duration,
          ),
      );
    } catch (error) {
      vscode.window.showErrorMessage("Failed to load time data: " + error);
    }
  }
  return sessions;
}

export const saveSessionHistory = (history: WorkSession[], path: string) => {
  try {
    fs.writeFileSync(path, JSON.stringify(history, null, 4), "utf8");
  } catch (error) {
    vscode.window.showErrorMessage("Failed to save time data: " + error);
  }
};

export const saveHistorySummarized = () => {
  let hist = loadSessionHistory(storageFilePath);
  let beforeCount = hist.length;
  let mergedHist = mergeWorkSessions(hist);
  let afterCount = mergedHist.length;
  saveSessionHistory(mergedHist, storageFilePath);
  vscode.window.showInformationMessage(
    `Merged sessions from ${beforeCount} to ${afterCount}`,
  );
};
