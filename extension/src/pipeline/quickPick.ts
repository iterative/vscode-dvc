import { relative } from 'path'
import isEqual from 'lodash.isequal'
import { QuickPickItemKind } from 'vscode'
import {
  PLOT_TEMPLATES,
  Value,
  ValueTree,
  isValueTree
} from '../cli/dvc/contract'
import { getFileExtension, loadDataFiles } from '../fileSystem'
import { quickPickOne, quickPickValue } from '../vscode/quickPick'
import { pickFiles } from '../vscode/resourcePicker'
import { Title } from '../vscode/title'
import { Toast } from '../vscode/toast'

const pickDataFiles = (): Thenable<string[] | undefined> =>
  pickFiles(Title.SELECT_PLOT_DATA, {
    'Data Formats': ['json', 'csv', 'tsv', 'yaml']
  })

const pickTemplateAndFields = async (
  cwd: string,
  fields: {
    [file: string]: string[]
  }
): Promise<PlotConfigData | undefined> => {
  const template = await quickPickOne(PLOT_TEMPLATES, 'Pick a Plot Template')

  if (!template) {
    return
  }

  const items = []

  for (const [file, keys] of Object.entries(fields)) {
    items.push(
      {
        kind: QuickPickItemKind.Separator,
        label: relative(cwd, file),
        value: undefined
      },
      ...keys.map(key => ({ label: key, value: { file, key } }))
    )
  }

  const x = await quickPickValue(items, { title: Title.SELECT_PLOT_X_METRIC })

  if (!x) {
    return
  }

  const y = await quickPickValue(
    items.filter(item => !isEqual(item.value, x)),
    { title: Title.SELECT_PLOT_Y_METRIC }
  )

  if (!y) {
    return
  }

  return { template, x, y }
}

export type PlotConfigData = {
  x: { file: string; key: string }
  template: string
  y: { file: string; key: string }
}

type UnknownValue = Value | ValueTree

const getFieldsFromArr = (dataArr: UnknownValue[]) => {
  const firstArrVal: UnknownValue = dataArr[0]
  if (!isValueTree(firstArrVal)) {
    return []
  }
  const fieldObjKeys = Object.keys(firstArrVal)
  const objsHaveSameKeys = dataArr.every(
    val => isValueTree(val) && isEqual(fieldObjKeys, Object.keys(val))
  )
  return objsHaveSameKeys ? fieldObjKeys : []
}

const getFieldsFromValue = (data: UnknownValue): string[] => {
  const isArray = Array.isArray(data)
  const isObj = isValueTree(data)
  if (!isArray && !isObj) {
    return []
  }

  const maybeFieldsObjArr = isArray ? data : data[Object.keys(data)[0]]

  return Array.isArray(maybeFieldsObjArr)
    ? getFieldsFromArr(maybeFieldsObjArr)
    : []
}

const showNotEnoughKeysToast = () =>
  Toast.showError(
    'The requested file(s) does not contain enough keys (columns) to generate a plot. Does the file or files follow the DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'
  )

const getFieldsFromDataFiles = (
  dataArr: { data: UnknownValue; file: string }[]
) => {
  const keys: {
    [file: string]: string[]
  } = {}
  let keysAmount = 0

  for (const { file, data } of dataArr) {
    const fields = getFieldsFromValue(data)

    if (fields.length === 0) {
      void showNotEnoughKeysToast()
      return
    }

    keysAmount += fields.length

    if (!keys[file]) {
      keys[file] = []
    }
    keys[file].push(...fields)
  }

  if (keysAmount < 2) {
    void showNotEnoughKeysToast()
    return
  }

  return keys
}

export const pickPlotConfiguration = async (
  cwd: string
): Promise<PlotConfigData | undefined> => {
  const files = await pickDataFiles()

  if (!files) {
    return
  }

  const fileExts = new Set(files.map(file => getFileExtension(file)))

  if (fileExts.size > 1) {
    return Toast.showError('Files must of the same type.')
  }

  const filesData = await loadDataFiles(files)

  if (!filesData) {
    return Toast.showError(
      'Failed to parse the requested file(s). Does the file or files contain data and follow the DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'
    )
  }

  const keys = getFieldsFromDataFiles(
    filesData as { data: UnknownValue; file: string }[]
  )

  if (!keys) {
    return
  }

  const templateAndFields = await pickTemplateAndFields(cwd, keys)

  if (!templateAndFields) {
    return
  }

  return { ...templateAndFields }
}
