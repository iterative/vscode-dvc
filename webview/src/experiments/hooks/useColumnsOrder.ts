import { ParamOrMetric } from 'dvc/src/experiments/webview/contract'
import { Model } from '../model'

export const useColumnOrder = (
  modelInstance: Model
): [ParamOrMetric[], (newOrder: string[]) => void] => {
  const columnOrderRepresentation =
    modelInstance.columnsOrderRepresentation || []
  const setColumnOrderRepresentation = (newOrder: string[]) =>
    modelInstance.createColumnsOrderRepresentation(newOrder)
  return [columnOrderRepresentation, setColumnOrderRepresentation]
}
