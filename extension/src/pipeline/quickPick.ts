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

export type PlotConfigData = {
  x: { file: string; key: string }
  template: string
  y: { file: string; key: string }
}

type UnknownValue = Value | ValueTree

type fileFields = { [file: string]: string[] }

const pickDataFiles = (): Promise<string[] | undefined> =>
  pickFiles(Title.SELECT_PLOT_DATA, {
    'Data Formats': ['json', 'csv', 'tsv', 'yaml']
  })

const pickTemplateAndFields = async (
  fields: fileFields
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
        label: file,
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

const joinList = (items: string[]) => {
  if (items.length <= 2) {
    return items.join(' and ')
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

const validateFileNames = (files: string[] | undefined) => {
  if (!files) {
    return []
  }
  const fileExts = [...new Set(files.map(file => getFileExtension(file)))]

  if (fileExts.length > 1) {
    void Toast.showError(
      `Found files with ${joinList(
        fileExts
      )} extensions. Files must be of the same type.`
    )
    return []
  }
  return files
}

const getMetricInfoFromArr = (
  dataArr: UnknownValue[]
): { arrLength: number; fields: string[] } | undefined => {
  const firstArrVal: UnknownValue = dataArr[0]
  if (!isValueTree(firstArrVal)) {
    return
  }
  const fieldObjKeys = Object.keys(firstArrVal)
  const objsHaveSameKeys = dataArr.every(
    val => isValueTree(val) && isEqual(fieldObjKeys, Object.keys(val))
  )
  if (!objsHaveSameKeys) {
    return
  }
  return { arrLength: dataArr.length, fields: fieldObjKeys }
}

const getMetricInfoFromValue = (
  data: UnknownValue
): { arrLength: number; fields: string[] } | undefined => {
  const isArray = Array.isArray(data)
  const isObj = isValueTree(data)
  if (!isArray && !isObj) {
    return
  }

  const maybeFieldsObjArr = isArray ? data : data[Object.keys(data)[0]]

  if (!Array.isArray(maybeFieldsObjArr)) {
    return
  }

  return getMetricInfoFromArr(maybeFieldsObjArr)
}

const getFileGuidelinesQuestion = (isSingleFile: boolean) =>
  `${
    isSingleFile ? 'Does the file' : 'Do the files'
  } follow the DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?`

const validateSingleDataFileFields = ({
  file,
  data
}: {
  file: string
  data: UnknownValue
}) => {
  const { fields = [] } = getMetricInfoFromValue(data) || {}

  if (fields.length < 2) {
    void Toast.showError(
      `${file} does not contain enough keys (columns) to generate a plot. ${getFileGuidelinesQuestion(
        true
      )}`
    )
    return
  }

  return { [file]: fields }
}

const getMetricInfoFromDataFiles = (
  dataArr: { data: UnknownValue; file: string }[]
) => {
  const invalidFiles: string[] = []
  const filesArrLength: Set<number> = new Set()
  const keys: fileFields = {}

  for (const { file, data } of dataArr) {
    const metricInfo = getMetricInfoFromValue(data)

    if (!metricInfo) {
      invalidFiles.push(file)
      continue
    }

    const { fields, arrLength } = metricInfo

    if (!keys[file]) {
      keys[file] = []
    }
    filesArrLength.add(arrLength)
    keys[file].push(...fields)
  }

  return { filesArrLength, invalidFiles, keys }
}

const validateMultiDataFileFields = (
  dataArr: { data: UnknownValue; file: string }[]
) => {
  const { keys, invalidFiles, filesArrLength } =
    getMetricInfoFromDataFiles(dataArr)

  if (invalidFiles.length > 0) {
    void Toast.showError(
      `${joinList(
        invalidFiles
      )} do not contain any keys (columns) for plot generation. ${getFileGuidelinesQuestion(
        invalidFiles.length === 1
      )}`
    )
    return
  }

  if (filesArrLength.size > 1) {
    void Toast.showError(
      `All files must have the same array (row) length. ${getFileGuidelinesQuestion(
        false
      )}`
    )
  }

  return keys
}

const validateFilesData = async (cwd: string, files: string[]) => {
  const filesData = (await loadDataFiles(files)) as {
    data: UnknownValue
    file: string
  }[]
  const relativeFilesData = filesData.map(({ data, file }) => ({
    data,
    file: relative(cwd, file)
  }))
  const invalidFilesData = relativeFilesData.filter(({ data }) => !data)

  if (invalidFilesData.length > 0) {
    const invalidFiles = joinList(invalidFilesData.map(({ file }) => file))
    void Toast.showError(
      `Failed to parse ${invalidFiles}. ${
        invalidFilesData.length === 1 ? 'Does the file' : 'Do the files'
      } contain data and follow the DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?`
    )
    return false
  }

  return files.length === 1
    ? validateSingleDataFileFields(relativeFilesData[0])
    : validateMultiDataFileFields(relativeFilesData)
}

export const pickPlotConfiguration = async (
  cwd: string
): Promise<PlotConfigData | undefined> => {
  const files = await pickDataFiles()
  const validFileNames = validateFileNames(files)

  if (validFileNames.length === 0) {
    return
  }

  const validFileFields = await validateFilesData(cwd, validFileNames)

  if (!validFileFields) {
    return
  }

  const templateAndFields = await pickTemplateAndFields(validFileFields)

  if (!templateAndFields) {
    return
  }

  return { ...templateAndFields }
}
