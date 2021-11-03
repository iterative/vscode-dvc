import { ParamOrMetric } from 'dvc/src/experiments/webview/contract'
import { Model } from '../model'

export const useColumnOrder = (): [
  ParamOrMetric[],
  (newOrder: string[]) => void
] => {
  const modelInstance = Model.getInstance()
  const columnOrderRepresentation =
    modelInstance.columnsOrderRepresentation || []
  const setColumnOrderRepresentation = (newOrder: string[]) =>
    modelInstance.createColumnsOrderRepresentation(newOrder)
  return [columnOrderRepresentation, setColumnOrderRepresentation]
}
