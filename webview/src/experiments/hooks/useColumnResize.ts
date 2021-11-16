import { ColumnDetail } from 'dvc/src/experiments/webview/contract'
import { Model } from '../model'

export const useColumnResize = (): [
  ColumnDetail[],
  (columnId: string, width: number) => void
] => {
  const modelInstance = Model.getInstance()
  const columnWidth = modelInstance.getColumnsWithWidth()
  const setColumnWidth = (columnId: string, width: number) =>
    modelInstance.setColumnWidth(columnId, width)
  return [columnWidth, setColumnWidth]
}
