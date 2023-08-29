import { relative } from 'path'
import {
  getFileExtension,
  loadJson,
  loadCsv,
  loadTsv,
  loadYaml,
  writeYaml
} from '../fileSystem'
import { quickPickOne } from '../vscode/quickPick'
import { pickFile } from '../vscode/resourcePicker'
import { Title } from '../vscode/title'
import { isObject } from '../util/object'

export const parseDataFile = (file: string) => {
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
    return loadYaml<Record<string, unknown>>(file)
  }
}

export const pickDataFile = () => {
  return pickFile(Title.SELECT_PLOT_DATA, {
    filters: {
      'Data Formats': ['json', 'csv', 'tsv', 'yaml']
    },
    openLabel: 'Select'
  })
}

// TBD for now, lets check for two formats:
// 1. array: first val is an object
// 2. object: first key value pair is an array like described above

export const getFieldOptions = (data: unknown): string[] => {
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

export const pickTemplateAndFields = async (
  fields: string[]
): Promise<{ x: string; y: string; template: string } | undefined> => {
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

  return { template, x, y }
}

// TBD I don't think using "dump" will work since
// 1. completely erases comments in the yaml file
// 2. wraps certain keys in strings...

// we either need to look into using our own functions
// to insert new lines into the yaml file
// or look into a different library
export const addNewPlotToDvcYaml = (
  cwd: string,
  dataFile: string,
  plot: { template: string; x: string; y: string }
) => {
  const dvcYamlFile = `${cwd}/dvc.yaml`
  const dvcYamlJs = loadYaml<Record<string, unknown>>(dvcYamlFile)

  if (!dvcYamlJs) {
    return
  }

  if (!dvcYamlJs.plots) {
    dvcYamlJs.plots = []
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  ;(dvcYamlJs.plots as Array<object>).push({
    [relative(cwd, dataFile)]: plot
  })

  return writeYaml(dvcYamlFile, dvcYamlJs)
}
