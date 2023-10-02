import isEqual from 'lodash.isequal'
import { QuickPickItemKind } from 'vscode'
import {
  PLOT_TEMPLATES,
  Value,
  ValueTree,
  isValueTree
} from '../cli/dvc/contract'
import { loadDataFiles } from '../fileSystem'
import { quickPickOne, quickPickValue } from '../vscode/quickPick'
import { pickFiles } from '../vscode/resourcePicker'
import { Title } from '../vscode/title'
import { Toast } from '../vscode/toast'
import { getFileName } from '../fileSystem/util'

const pickDataFiles = (): Thenable<string[] | undefined> =>
  pickFiles(Title.SELECT_PLOT_DATA, {
    'Data Formats': ['json', 'csv', 'tsv', 'yaml']
  })

const pickTemplateAndFields = async (fields: {
  [file: string]: string[]
}): Promise<PlotConfigData | undefined> => {
  const template = await quickPickOne(PLOT_TEMPLATES, 'Pick a Plot Template')

  if (!template) {
    return
  }

  const items = []

  for (const [file, keys] of Object.entries(fields)) {
    items.push(
      {
        kind: QuickPickItemKind.Separator,
        label: getFileName(file),
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
    items.filter(
      item => item.value?.key !== x.key && item.value?.file !== x.file
    ),
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

const getFieldOptions = (data: UnknownValue): string[] => {
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

const getFieldOptionsFromArr = (
  dataArr: { data: UnknownValue; file: string }[]
) => {
  const keys: {
    [file: string]: string[]
  } = {}
  let keysAmount = 0

  for (const { file, data } of dataArr) {
    const fields = getFieldOptions(data)

    if (fields.length === 0) {
      continue
    }

    keysAmount += fields.length

    if (!keys[file]) {
      keys[file] = []
    }
    keys[file].push(...fields)
  }

  return { keys, keysAmount }
}

export const pickPlotConfiguration = async (): Promise<
  PlotConfigData | undefined
> => {
  const files = await pickDataFiles()

  if (!files) {
    return
  }

  const filesData = await loadDataFiles(files)

  if (!filesData) {
    return Toast.showError(
      'Failed to parse the requested file(s). Does the file or files contain data and follow the DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'
    )
  }

  const { keys, keysAmount } = getFieldOptionsFromArr(
    filesData as { data: UnknownValue; file: string }[]
  )

  if (keysAmount < 2) {
    return Toast.showError(
      'The requested file(s) does not contain enough keys (columns) to generate a plot. Does the file or files follow the DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'
    )
  }

  const templateAndFields = await pickTemplateAndFields(keys)

  if (!templateAndFields) {
    return
  }

  return { ...templateAndFields }
}
