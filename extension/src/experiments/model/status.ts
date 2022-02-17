export const MAX_SELECTED_EXPERIMENTS = 6

export enum Status {
  SELECTED = 1,
  UNSELECTED = 0
}

export type Statuses = Record<string, Status>

const getSelectedCount = (status: Statuses): number =>
  Object.values(status).reduce((acc, expStatus) => acc + expStatus, 0)

export const canSelect = (status: Statuses): boolean =>
  getSelectedCount(status) < MAX_SELECTED_EXPERIMENTS
