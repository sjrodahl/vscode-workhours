export class WorkSession {
  description?: string;
  endTime?: Date;
  startTime?: Date;
  projectTag?: string;
  duration?: number;

  constructor(
    description?: string,
    projectTag?: string,
    startTime?: Date,
    endTime?: Date,
    duration?: number,
  ) {
    this.description = description;
    this.projectTag = projectTag;
    this.startTime = startTime;
    this.endTime = endTime;
    this.duration = duration;
  }

  public start(): void {
    if (!this.startTime) {
      this.startTime = new Date();
    }
  }

  public stop(): void {
    if (this.startTime && !this.endTime) {
      this.endTime = new Date();
    }
  }

  public getDuration(): number {
    if (this.duration) {
      return this.duration;
    } else if (this.startTime) {
      const endTime = this.endTime ? this.endTime : new Date();
      const diffInMs = endTime.getTime() - this.startTime.getTime();
      return diffInMs / (1000 * 60 * 60);
    }
    return 0;
  }
}

export function mergeWorkSessions(sessions: WorkSession[]): WorkSession[] {
  const groupedSessions: { [key: string]: WorkSession[] } = {};

  sessions.forEach((session) => {
    if (session.startTime && session.endTime && session.projectTag) {
      const key = `${session.startTime.toISOString().split("T")[0]}-${session.projectTag}`;
      if (!groupedSessions[key]) {
        groupedSessions[key] = [];
      }
      groupedSessions[key].push(session);
    }
  });
  const unmergedSessions: WorkSession[] = sessions.filter(
    (session) => !session.startTime || !session.endTime || !session.projectTag,
  );
  const mergedSessions: WorkSession[] = Object.values(groupedSessions).map(
    (group) => {
      const earliestStartTime = group.reduce(
        (earliest, session) =>
          session.startTime && session.startTime < earliest
            ? session.startTime
            : earliest,
        group[0].startTime!,
      );

      const latestEndTime = group.reduce(
        (latest, session) =>
          session.endTime && session.endTime > latest
            ? session.endTime
            : latest,
        group[0].endTime!,
      );

      const totalDuration = group.reduce(
        (sum, session) => sum + session.getDuration(),
        0,
      );

      const mergedDescription = group
        .map((session) => session.description)
        .join(". ");

      const mergedSession = new WorkSession(
        mergedDescription,
        group[0].projectTag,
      );
      mergedSession.startTime = earliestStartTime;
      mergedSession.endTime = latestEndTime;
      mergedSession.duration = totalDuration;

      return mergedSession;
    },
  );
  return [...mergedSessions, ...unmergedSessions];
}
