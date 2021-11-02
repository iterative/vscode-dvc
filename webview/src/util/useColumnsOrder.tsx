import { ParamOrMetric } from 'dvc/src/experiments/webview/contract'
import { isStorybook } from './storybook'
import { Model } from '../model'

export const useColumnOrder = (): [
  ParamOrMetric[],
  (newOrder: string[]) => void
] => {
  if (!isStorybook) {
    const modelInstance = Model.getInstance()
    const columnOrderRepresentation =
      modelInstance.columnsOrderRepresentation || []
    const setColumnOrderRepresentation = (newOrder: string[]) =>
      modelInstance.createColumnsOrderRepresentation(newOrder)
    return [columnOrderRepresentation, setColumnOrderRepresentation]
  }
  return [[], () => {}]
}
