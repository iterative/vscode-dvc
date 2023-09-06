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

export const pickPlotConfiguration = async (): Promise<
  PlotConfigData | undefined
> => {
  // TBD data file validation will be in next pr
  const file = (await pickDataFile()) as string
  const data = (await parseDataFile(file)) as Record<string, unknown>[]
  const keys = Object.keys(data[0])

  const templateAndFields = await pickTemplateAndFields(keys)

  if (!templateAndFields) {
    return
  }

  return { ...templateAndFields, dataFile: file }
}
