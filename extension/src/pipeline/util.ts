import { PLOT_TEMPLATES } from '../cli/dvc/contract'
import {
  getFileExtension,
  loadJson,
  loadCsv,
  loadTsv,
  loadYaml
} from '../fileSystem'
import { quickPickOne } from '../vscode/quickPick'
import { pickFile } from '../vscode/resourcePicker'
import { Title } from '../vscode/title'

const parseDataFile = (file: string) => {
  const ext = getFileExtension(file)

  switch (ext) {
    case '.csv':
      return loadCsv(file)
    case '.json':
      return loadJson<Record<string, unknown> | unknown[]>(file)
    case '.tsv':
      return loadTsv(file)
    case '.yaml':
      return loadYaml<Record<string, unknown>>(file)
  }
}

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

export const pickPlotConfiguration = async (): Promise<
  PlotConfigData | undefined
> => {
  const file = (await pickDataFile()) as string
  const data = (await parseDataFile(file)) as Record<string, unknown>[]
  const keys = Object.keys(data[0])

  const templateAndFields = await pickTemplateAndFields(keys)

  if (!templateAndFields) {
    return
  }

  return { ...templateAndFields, dataFile: file }
}
