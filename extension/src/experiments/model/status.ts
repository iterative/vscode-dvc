import { Experiment } from '../webview/contract'

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

export const getMaxSelected = (experiments: Experiment[]) =>
  experiments
    .sort((a, b) => {
      if (a.running === b.running) {
        return (
          new Date(b.timestamp || 0).getTime() -
          new Date(a.timestamp || 0).getTime()
        )
      }
      return a.running ? -1 : 1
    })
    .slice(0, MAX_SELECTED_EXPERIMENTS)
