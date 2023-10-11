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
import { quickPickOne, quickPickUserOrderedValues } from '../vscode/quickPick'
import { pickFiles } from '../vscode/resourcePicker'
import { Title } from '../vscode/title'
import { Toast } from '../vscode/toast'
import { getInput } from '../vscode/inputBox'

export type PlotConfigData = {
  x: { [file: string]: string[] | string }
  template: string
  title: string
  y: { [file: string]: string[] | string }
}

type UnknownValue = Value | ValueTree

type FileFields = { file: string; fields: string[] }[]

const pickDataFiles = (): Promise<string[] | undefined> =>
  pickFiles(Title.SELECT_PLOT_DATA, {
    'Data Formats': ['json', 'csv', 'tsv', 'yaml']
  })

const formatFieldQuickPickValues = (
  values: { file: string; key: string }[]
) => {
  const formattedFields: { [file: string]: string[] | string } = {}

  for (const { file, key } of values) {
    if (!formattedFields[file]) {
      formattedFields[file] = key
      continue
    }

    const prevFileValue = formattedFields[file]
    if (typeof prevFileValue === 'string') {
      formattedFields[file] = [prevFileValue]
    }

    ;(formattedFields[file] as string[]).push(key)
  }

  return formattedFields
}

const verifyFilesHavingSingleField = (files: {
  [file: string]: string[] | string
}) => {
  for (const [file, fields] of Object.entries(files)) {
    if (Array.isArray(fields)) {
      void Toast.showError(
        `${file} cannot have more than one metric selected. See [an example](https://dvc.org/doc/user-guide/project-structure/dvcyaml-files#available-configuration-fields) of a plot with multipe x metrics.`
      )
      return
    }
  }

  return files
}

const verifyXFields = (
  xValues: { file: string; key: string }[] | undefined
) => {
  if (!xValues || xValues.length === 0) {
    return
  }

  const x = formatFieldQuickPickValues(xValues)

  const doFilesHaveOneField = verifyFilesHavingSingleField(x)

  if (!doFilesHaveOneField) {
    return
  }

  return { firstXKey: xValues[0].key, x: x as PlotConfigData['x'] }
}

const verifyYFields = (
  yValues: { file: string; key: string }[] | undefined,
  xFieldsLength: number
) => {
  if (!yValues || yValues.length === 0) {
    return
  }

  const y = formatFieldQuickPickValues(yValues)

  if (xFieldsLength === 1) {
    return { firstYKey: yValues[0].key, y }
  }

  if (yValues.length !== xFieldsLength) {
    void Toast.showError(
      'The amount of y metrics needs to match the amount of x metrics. See [an example](https://dvc.org/doc/user-guide/project-structure/dvcyaml-files#available-configuration-fields) of a plot with multiple x metrics.'
    )
    return
  }

  const doFilesHaveOneField = verifyFilesHavingSingleField(y)

  if (!doFilesHaveOneField) {
    return
  }

  return { firstYKey: yValues[0].key, y }
}

const pickFields = async (
  fileFields: FileFields
): Promise<
  | {
      fields: Omit<PlotConfigData, 'title' | 'template'>
      firstXKey: string
      firstYKey: string
    }
  | undefined
> => {
  const items = []

  for (const { file, fields } of fileFields) {
    items.push(
      {
        kind: QuickPickItemKind.Separator,
        label: file,
        value: undefined
      },
      ...fields.map(key => ({ label: key, value: { file, key } }))
    )
  }

  const xValues = (await quickPickUserOrderedValues(items, {
    title: Title.SELECT_PLOT_X_METRIC
  })) as { file: string; key: string }[] | undefined

  const xFieldInfo = verifyXFields(xValues)

  if (!xFieldInfo) {
    return
  }

  const { x, firstXKey } = xFieldInfo

  const yValues = (await quickPickUserOrderedValues(
    items.filter(item => xValues?.every(val => !isEqual(val, item.value))),
    { title: Title.SELECT_PLOT_Y_METRIC }
  )) as { file: string; key: string }[] | undefined

  const yFieldInfo = verifyYFields(yValues, xValues?.length || 0)

  if (!yFieldInfo) {
    return
  }

  const { y, firstYKey } = yFieldInfo

  return {
    fields: { x, y },
    firstXKey,
    firstYKey
  }
}

const pickPlotConfigData = async (
  fileFields: FileFields
): Promise<PlotConfigData | undefined> => {
  const template = await quickPickOne(PLOT_TEMPLATES, 'Pick a Plot Template')

  if (!template) {
    return
  }

  const fieldsInfo = await pickFields(fileFields)

  if (!fieldsInfo) {
    return
  }

  const { fields, firstYKey, firstXKey } = fieldsInfo

  const title = await getInput(
    Title.ENTER_PLOT_TITLE,
    `${firstXKey} vs ${firstYKey}`
  )

  if (!title) {
    return
  }

  return { template, title, ...fields }
}

const joinList = (items: string[]) => {
  if (items.length <= 2) {
    return items.join(' and ')
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

const validateFileNames = (files: string[] | undefined) => {
  if (!files) {
    return
  }
  const fileExts = [...new Set(files.map(file => getFileExtension(file)))]

  if (fileExts.length > 1) {
    void Toast.showError(
      `Found files with ${joinList(
        fileExts
      )} extensions. Files must be of the same type.`
    )
    return
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

const dvcPlotGuidelinesQuestion =
  'Does the file contain data and follow the DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'

const showNotEnoughKeysToast = (file: string) =>
  Toast.showError(
    `${file} does not contain enough keys (columns) to generate a plot. ${dvcPlotGuidelinesQuestion}`
  )

const validateSingleFileData = ({
  file,
  data
}: {
  data: UnknownValue
  file: string
}) => {
  const { fields = [] } = getMetricInfoFromValue(data) || {}

  if (fields.length < 2) {
    void showNotEnoughKeysToast(file)
    return
  }

  return [{ fields, file }]
}

const validateMultiFilesData = (
  filesData: { data: UnknownValue; file: string }[]
) => {
  const filesArrLength: Set<number> = new Set()
  const keys: FileFields = []

  for (const { file, data } of filesData) {
    const metricInfo = getMetricInfoFromValue(data)
    if (!metricInfo) {
      void showNotEnoughKeysToast(file)
      return
    }

    const { arrLength, fields } = metricInfo
    keys.push({ fields, file })
    filesArrLength.add(arrLength)
  }

  if (filesArrLength.size > 1) {
    void Toast.showError(
      'All files must have the same array (list) length. See [examples](https://dvc.org/doc/command-reference/plots/show#sourcing-x-and-y-from-different-files) of multiple files being used in DVC plots.'
    )

    return
  }

  return keys
}

const validateFilesData = async (cwd: string, files: string[]) => {
  const filesData = (await loadDataFiles(files)) as {
    data: UnknownValue
    file: string
  }[]
  const relativeFilesData = []

  for (const { file, data } of filesData) {
    const relativeFile = relative(cwd, file)
    if (!data) {
      void Toast.showError(
        `Failed to parse ${relativeFile}. ${dvcPlotGuidelinesQuestion}`
      )
      return
    }

    relativeFilesData.push({ data, file: relativeFile })
  }

  return relativeFilesData.length === 1
    ? validateSingleFileData(relativeFilesData[0])
    : validateMultiFilesData(relativeFilesData)
}

export const pickPlotConfiguration = async (
  cwd: string
): Promise<PlotConfigData | undefined> => {
  const files = await pickDataFiles()
  const validFileNames = validateFileNames(files)

  if (!validFileNames) {
    return
  }

  const validFileFields = await validateFilesData(cwd, validFileNames)

  if (!validFileFields) {
    return
  }

  return pickPlotConfigData(validFileFields)
}
