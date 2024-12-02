export interface ISeveraWorkhour {
  description?: string;
  endTime?: string;
  eventDate: string;
  invoice?: { guid: string };
  invoiceQuantity?: number;
  plannedInvoiceQuantity?: number;
  invoiceRowComment?: string;
  invoiceRowDescription?: string;
  isApproved?: boolean;
  isBillable?: boolean;
  overtime?: { guid: string };
  phase: { guid: string };
  quantity?: number;
  startTime?: string;
  unitPrice?: { amount: number; currencyCode: string };
  user: { guid: string };
  workType: { guid: string };
}

export interface ISeveraPhase {
  guid: string;
  name: string;
  createdDateTime: string;
  createdBy: {
    code: string;
    name: string;
    guid: string;
    firstName: string;
    lastName: string;
  };
  lastUpdatedDateTime: string;
  lastUpdatedBy: {
    code: string;
    name: string;
    guid: string;
    firstName: string;
    lastName: string;
  };
  project: {
    guid: string;
    name: string;
    number: number;
    isInternal: boolean;
    isClosed: boolean;
  };
  parentPhase: {
    guid: string;
    name: string;
  };
  isCompleted: boolean;
  isLocked: boolean;
  startDate: string;
  deadline: string;
  workHoursEstimate: number;
  originalWorkHoursEstimate: number;
  originalStartDate: string;
  originalDeadline: string;
  sortOrder: number;
  defaultWorkType: {
    guid: string;
    name: string;
  };
  code: string;
  currencyCode: {
    guid: string;
    name: string;
    code: string;
    symbol: string;
  };
  phaseStatus: {
    description: string;
    phaseStatusTypeGuid: string;
    name: string;
  };
}

export interface ISeveraProject {}
