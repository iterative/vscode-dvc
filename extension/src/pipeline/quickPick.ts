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
import {
  QuickPickItemWithValue,
  quickPickOne,
  quickPickUserOrderedValues
} from '../vscode/quickPick'
import { pickFiles } from '../vscode/resourcePicker'
import { Title } from '../vscode/title'
import { Toast } from '../vscode/toast'
import { getInput } from '../vscode/inputBox'

export type PlotConfigDataAxis = { [file: string]: string[] }

export type PlotConfigData = {
  x: PlotConfigDataAxis
  template: string
  title: string
  y: PlotConfigDataAxis
}

type UnknownValue = Value | ValueTree

type FileFields = { file: string; fields: string[] }[]
type QuickPickFieldValues = { file: string; field: string }[]

const multipleXMetricsExample =
  'See [an example](https://dvc.org/doc/user-guide/project-structure/dvcyaml-files#available-configuration-fields) of a plot with multiple x metrics.'

const pickDataFiles = (): Promise<string[] | undefined> =>
  pickFiles(Title.SELECT_PLOT_DATA, {
    'Data Formats': ['json', 'csv', 'tsv', 'yaml']
  })

const formatFieldQuickPickValues = (
  values: QuickPickFieldValues | undefined
) => {
  if (!values || values.length === 0) {
    return
  }

  const formattedFields: PlotConfigDataAxis = {}

  for (const { file, field } of values) {
    if (!formattedFields[file]) {
      formattedFields[file] = [field]
      continue
    }

    formattedFields[file].push(field)
  }

  return formattedFields
}

const verifyFilesHaveSingleField = (files: PlotConfigDataAxis) => {
  for (const [file, fields] of Object.entries(files)) {
    if (fields.length > 1) {
      void Toast.showError(
        `${file} cannot have more than one metric selected. ${multipleXMetricsExample}`
      )
      return
    }
  }

  return files
}

const verifyXFields = (xValues: QuickPickFieldValues | undefined) => {
  const x = formatFieldQuickPickValues(xValues)

  if (!x) {
    return
  }

  const doFilesHaveOneField = verifyFilesHaveSingleField(x)

  if (!doFilesHaveOneField) {
    return
  }

  return x
}

const pickYFieldsWithMultiXFields = async (
  yItems: QuickPickItemWithValue<{ file: string; field: string } | undefined>[],
  xFieldsLength: number
) => {
  const yValues = (await quickPickUserOrderedValues(
    yItems,
    {
      title: `Select ${xFieldsLength} Metrics for Y` as Title
    },
    xFieldsLength
  )) as QuickPickFieldValues | undefined

  const y = formatFieldQuickPickValues(yValues)

  if (!y) {
    return
  }

  if (yValues?.length !== xFieldsLength) {
    void Toast.showError(
      `Found ${xFieldsLength} x metrics and ${yValues?.length} y metric(s). When there are multiple x metrics selected there must be an equal number of y metrics. ${multipleXMetricsExample}`
    )
    return
  }

  const doFilesHaveOneField = verifyFilesHaveSingleField(y)

  if (!doFilesHaveOneField) {
    return
  }

  return y
}

const pickYFields = async (
  yItems: QuickPickItemWithValue<{ file: string; field: string } | undefined>[]
) => {
  const yValues = (await quickPickUserOrderedValues(yItems, {
    title: Title.SELECT_PLOT_Y_METRIC
  })) as QuickPickFieldValues | undefined

  const y = formatFieldQuickPickValues(yValues)

  if (!y) {
    return
  }

  return y
}

const pickFields = async (
  fileFields: FileFields
): Promise<
  | {
      fields: Omit<PlotConfigData, 'title' | 'template'>
      firstXField: string
      firstYField: string
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
      ...fields.map(field => ({ label: field, value: { field, file } }))
    )
  }

  const xValues = (await quickPickUserOrderedValues(items, {
    title: Title.SELECT_PLOT_X_METRIC
  })) as QuickPickFieldValues | undefined

  const x = verifyXFields(xValues)
  if (!x) {
    return
  }

  const xValuesLength = xValues?.length || 0

  const yItems = items.filter(
    item => item.value === undefined || !xValues?.includes(item.value)
  )
  const y =
    xValuesLength > 1
      ? await pickYFieldsWithMultiXFields(yItems, xValuesLength)
      : await pickYFields(yItems)

  if (!y) {
    return
  }

  const [firstXField] = Object.values(x)[0]
  const [firstYField] = Object.values(y)[0]

  return {
    fields: { x, y },
    firstXField,
    firstYField
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

  const { fields, firstYField, firstXField } = fieldsInfo

  const title = await getInput(
    Title.ENTER_PLOT_TITLE,
    `${firstXField} vs ${firstYField}`
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
  const fileFields: FileFields = []

  for (const { file, data } of filesData) {
    const metricInfo = getMetricInfoFromValue(data)
    if (!metricInfo) {
      void showNotEnoughKeysToast(file)
      return
    }

    const { arrLength, fields } = metricInfo
    fileFields.push({ fields, file })
    filesArrLength.add(arrLength)
  }

  if (filesArrLength.size > 1) {
    void Toast.showError(
      'All files must have the same array (list) length. See [examples](https://dvc.org/doc/command-reference/plots/show#sourcing-x-and-y-from-different-files) of multiple files being used in DVC plots.'
    )

    return
  }

  return fileFields
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
