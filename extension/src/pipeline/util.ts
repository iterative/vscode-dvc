import { relative } from 'path'
import { YAMLSeq, stringify } from 'yaml'
import { readFileSync, writeFileSync } from 'fs-extra'
import {
  getFileExtension,
  loadJson,
  loadCsv,
  loadTsv,
  loadYamlAsJs,
  loadYamlAsDoc
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
    return loadYamlAsJs<Record<string, unknown>>(file)
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
// 2. object: first key value is an array like described above

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
// TBD move to file utils
export const addNewPlotToDvcYaml = (
  cwd: string,
  dataFile: string,
  plot: { template: string; x: string; y: string }
) => {
  const dvcYamlFile = `${cwd}/dvc.yaml`
  const dvcYamlDoc = loadYamlAsDoc(dvcYamlFile)

  if (!dvcYamlDoc) {
    return
  }

  const { doc, lineCounter } = dvcYamlDoc
  const plotName = relative(cwd, dataFile)
  const plotYaml = stringify({ plots: [{ [plotName]: plot }] }).split('\n')
  const yamlsContentLines = readFileSync(dvcYamlFile, 'utf8').split('\n')

  const plots = doc.get('plots', true) as YAMLSeq | undefined

  if (!plots?.range) {
    yamlsContentLines.push(...plotYaml)
    writeFileSync(dvcYamlFile, yamlsContentLines.join('\n'))
    return
  }

  const insertLineNum = lineCounter.linePos(plots.range[2])
  yamlsContentLines.splice(insertLineNum.line - 1, 0, ...plotYaml.slice(1))

  writeFileSync(dvcYamlFile, yamlsContentLines.join('\n'))
}
