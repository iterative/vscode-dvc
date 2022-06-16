import { createAction } from '@reduxjs/toolkit'
import { ReducerName } from './constants'

export enum PlotAction {
  CLEAR_DATA = 'clearData'
}

export const clearData = createAction<ReducerName | undefined>(
  PlotAction.CLEAR_DATA
)
