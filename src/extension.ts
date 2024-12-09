import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { WorkSession } from "./workhours/WorkSession";

let currentSession: WorkSession | null = null;
let storageFilePath: string;
let sessionHistory: WorkSession[] = [];
let statusBarItem: vscode.StatusBarItem;
let statusBarInterval: NodeJS.Timeout | null = null;

let currentProject: string;

export function activate(context: vscode.ExtensionContext) {
  // Initialize the storage file path
  storageFilePath = path.join(
    context.globalStorageUri.fsPath,
    "workhours.json",
  );

  // Ensure the storage directory exists
  if (!fs.existsSync(context.globalStorageUri.fsPath)) {
    fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
  }

  // Load existing time data
  loadSessionHistory();

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
      saveSessionHistory();
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
        .showQuickPick(["Project A", "Project B", "Project C"], {
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

  const editCommand = vscode.commands.registerCommand("workhours.edit", () => {
    if (fs.existsSync(storageFilePath)) {
      vscode.workspace.openTextDocument(storageFilePath).then((doc) => {
        vscode.window.showTextDocument(doc);
      });
    } else {
      vscode.window.showInformationMessage("No work hours file found to edit.");
    }
  });

  context.subscriptions.push(
    startCommand,
    stopCommand,
    showCommand,
    selectProjectCommand,
    editCommand,
  );
}

export function deactivate() {
  if (currentSession) {
    currentSession.stop();
    saveSessionHistory();
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

const loadSessionHistory = () => {
  if (fs.existsSync(storageFilePath)) {
    try {
      const data = fs.readFileSync(storageFilePath, "utf8");
      sessionHistory = JSON.parse(data, reviveDate);
    } catch (error) {
      vscode.window.showErrorMessage("Failed to load time data: " + error);
    }
  }
};

const saveSessionHistory = () => {
  try {
    fs.writeFileSync(
      storageFilePath,
      JSON.stringify(sessionHistory, null, 4),
      "utf8",
    );
  } catch (error) {
    vscode.window.showErrorMessage("Failed to save time data: " + error);
  }
};
