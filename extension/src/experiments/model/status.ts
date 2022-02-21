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

export const tooManySelected = (experiments: Experiment[]): boolean =>
  experiments.length > MAX_SELECTED_EXPERIMENTS

const getEpoch = (timestamp: string | null | undefined) =>
  new Date(timestamp || 0).getTime()

const compareTimestamps = (a: Experiment, b: Experiment) =>
  getEpoch(b.timestamp) - getEpoch(a.timestamp)

export const getMaxSelected = (experiments: Experiment[]) =>
  experiments
    .sort((a, b) => {
      if (a.running === b.running) {
        return compareTimestamps(a, b)
      }
      return a.running ? -1 : 1
    })
    .slice(0, MAX_SELECTED_EXPERIMENTS)
