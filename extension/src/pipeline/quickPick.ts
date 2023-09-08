import {
  PLOT_TEMPLATES,
  Value,
  ValueTree,
  isValueTree
} from '../cli/dvc/contract'
import { loadDataFile } from '../fileSystem'
import { quickPickOne } from '../vscode/quickPick'
import { pickFile } from '../vscode/resourcePicker'
import { Title } from '../vscode/title'
import { Toast } from '../vscode/toast'

const pickDataFile = () => {
  return pickFile(Title.SELECT_PLOT_DATA, {
    'Data Formats': ['json', 'csv', 'tsv', 'yaml']
  })
}

const pickTemplateAndFields = async (
  fields: string[]
): Promise<{ x: string; y: string; template: string } | undefined> => {
  const template = await quickPickOne(PLOT_TEMPLATES, 'Pick a Plot Template')

  if (!template) {
    return
  }

  const x = await quickPickOne(fields, 'Pick a Metric for X')

  if (!x) {
    return
  }

  const y = await quickPickOne(
    fields.filter(field => x !== field),
    'Pick a Metric for Y'
  )

  if (!y) {
    return
  }

  return { template, x, y }
}

export type PlotConfigData = {
  dataFile: string
  template: string
  x: string
  y: string
}

type UnknownValue = Value | ValueTree

const getFieldOptions = (data: UnknownValue): string[] => {
  const isArray = Array.isArray(data)
  const isObj = isValueTree(data)
  if (!isArray && !isObj) {
    return []
  }

  const maybeFieldsObjArr = isArray ? data : data[Object.keys(data)[0]]

  if (!Array.isArray(maybeFieldsObjArr)) {
    return []
  }

  const maybeFieldsObj: UnknownValue = maybeFieldsObjArr[0]
  return isValueTree(maybeFieldsObj) ? Object.keys(maybeFieldsObj) : []
}

export const pickPlotConfiguration = async (): Promise<
  PlotConfigData | undefined
> => {
  const file = await pickDataFile()

  if (!file) {
    return
  }

  const data = await loadDataFile(file)

  if (!data) {
    return Toast.showError(
      'Failed to parse the requested file. Does the file contain data and follow the DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'
    )
  }

  const keys = getFieldOptions(data as UnknownValue)

  if (keys.length < 2) {
    return Toast.showError(
      'The request file does not contain enough keys (columns) to generate a plot. Does the file follow the DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'
    )
  }

  const templateAndFields = await pickTemplateAndFields(keys)

  if (!templateAndFields) {
    return
  }

  return { ...templateAndFields, dataFile: file }
}
