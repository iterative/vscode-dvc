import { UnknownAction } from '@reduxjs/toolkit'
import { TableData } from 'dvc/src/experiments/webview/contract'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import { SetupData } from 'dvc/src/setup/webview/contract'
import type { ExperimentsActions } from '../experiments/components/App'
import type { ExperimentsDispatch } from '../experiments/store'
import type { PlotsActions } from '../plots/components/App'
import type { PlotsDispatch } from '../plots/store'
import type { SetupActions } from '../setup/components/App'
import type { SetupDispatch } from '../setup/store'

export const dispatchActions = (
  actionToDispatch: ExperimentsActions | PlotsActions | SetupActions,
  stateUpdate: NonNullable<TableData | PlotsData | SetupData>,
  dispatch: ExperimentsDispatch | PlotsDispatch | SetupDispatch
) => {
  for (const key of Object.keys(stateUpdate)) {
    const tKey = key as keyof typeof stateUpdate
    const value = stateUpdate[tKey]
    const action = actionToDispatch[tKey] as (
      input: typeof value
    ) => UnknownAction

    if (!action) {
      continue
    }
    dispatch(action(value))
  }
}
