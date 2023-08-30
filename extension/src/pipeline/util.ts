import {
  getFileExtension,
  loadJson,
  loadCsv,
  loadTsv,
  loadYamlAsJs
} from '../fileSystem'
import { quickPickOne } from '../vscode/quickPick'
import { pickFile } from '../vscode/resourcePicker'
import { Title } from '../vscode/title'
import { isObject } from '../util/object'
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
    'Pick a plot template'
  )

  if (!template) {
    return
  }

  const x = await quickPickOne(fields, 'Pick A Metric for X')

  if (!x) {
    return
  }

  const y = await quickPickOne(
    fields.filter(field => x !== field),
    'Pick A Metric for Y'
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

export const pickPlotConfiguration = async (): Promise<
  PlotConfigData | undefined
> => {
  const file = await pickDataFile()

  if (!file) {
    return
  }

  const data = parseDataFile(file)

  if (!data) {
    // TBD maybe we could add an action to toasts that lets you try again?
    return Toast.showError('Failed to parse data from file.')
  }

  const keys = getFieldOptions(data)

  if (keys.length === 0) {
    return Toast.showError(
      'Failed to find field options for plot data. Is your file following DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'
    )
  }

  const templateAndFields = await pickTemplateAndFields(keys)

  if (!templateAndFields) {
    return
  }

  return { ...templateAndFields, dataFile: file }
}
