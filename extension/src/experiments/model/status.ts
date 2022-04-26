import { Color } from './colors'
import { Experiment } from '../webview/contract'

export const MAX_SELECTED_EXPERIMENTS = 7

export const UNSELECTED = 0

export type ColoredStatus = Record<string, Color | typeof UNSELECTED>

const getSelectedCount = (status: ColoredStatus): number =>
  Object.values(status).filter(Boolean).length

export const canSelect = (status: ColoredStatus): boolean =>
  getSelectedCount(status) < MAX_SELECTED_EXPERIMENTS

export const tooManySelected = (experiments: Experiment[]): boolean =>
  experiments.length > MAX_SELECTED_EXPERIMENTS

const getEpoch = (timestamp: string | null | undefined) =>
  new Date(timestamp || 0).getTime()

const compareTimestamps = (a: Experiment, b: Experiment) =>
  getEpoch(b.timestamp) - getEpoch(a.timestamp)

export const limitToMaxSelected = (experiments: Experiment[]) =>
  experiments
    .sort((a, b) => {
      if (a.running === b.running) {
        return compareTimestamps(a, b)
      }
      return a.running ? -1 : 1
    })
    .slice(0, MAX_SELECTED_EXPERIMENTS)
