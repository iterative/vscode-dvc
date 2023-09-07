import {
  getFileExtension,
  loadJson,
  loadCsv,
  loadTsv,
  loadYamlAsJs
} from '../fileSystem'
import { isObject } from '../util/object'
import { quickPickOne } from '../vscode/quickPick'
import { pickFile } from '../vscode/resourcePicker'
import { Title } from '../vscode/title'
import { Toast } from '../vscode/toast'

const parseDataFile = (file: string) => {
  const ext = getFileExtension(file)

  if (ext === '.json') {
    return loadJson<Record<string, unknown> | unknown[]>(file)
  }

  if (ext === '.csv') {
    return loadCsv(file)
  }

  if (ext === '.tsv') {
    return loadTsv(file)
  }

  if (ext === '.yaml') {
    return loadYamlAsJs<Record<string, unknown>>(file)
  }
}

const pickDataFile = () => {
  return pickFile(Title.SELECT_PLOT_DATA, {
    filters: {
      'Data Formats': ['json', 'csv', 'tsv', 'yaml']
    },
    openLabel: 'Select'
  })
}

const pickTemplateAndFields = async (
  fields: string[]
): Promise<{ x: string; y: string; template: string } | undefined> => {
  const template = await quickPickOne(
    [
      'simple',
      'linear',
      'confusion',
      'confusion_normalized',
      'scatter',
      'scatter_jitter',
      'smooth',
      'bar_horizontal_sorted',
      'bar_horizontal'
    ],
    'Pick a Plot Template'
  )

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

const getFieldOptions = (data: unknown): string[] => {
  const isArray = Array.isArray(data)
  const isObj = isObject(data)
  if (!isArray && !isObj) {
    return []
  }

  const maybeFieldsObjArr = isArray ? data : data[Object.keys(data)[0]]

  if (!Array.isArray(maybeFieldsObjArr)) {
    return []
  }

  const maybeFieldsObj: unknown = maybeFieldsObjArr[0]
  return isObject(maybeFieldsObj) ? Object.keys(maybeFieldsObj) : []
}

export const pickPlotConfiguration = async (): Promise<
  PlotConfigData | undefined
> => {
  const file = await pickDataFile()

  if (!file) {
    return
  }

  const data = await parseDataFile(file)
  const failedToParseMessage =
    'Failed to find field options for plot data. Is your file following DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'

  if (!data) {
    return Toast.showError(failedToParseMessage)
  }

  const keys = getFieldOptions(data)

  if (keys.length < 2) {
    return Toast.showError(failedToParseMessage)
  }

  const templateAndFields = await pickTemplateAndFields(keys)

  if (!templateAndFields) {
    return
  }

  return { ...templateAndFields, dataFile: file }
}
