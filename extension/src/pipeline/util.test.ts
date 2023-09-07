import { pickPlotConfiguration } from './util'
import { pickFile } from '../vscode/resourcePicker'
import { quickPickOne } from '../vscode/quickPick'
import {
  loadJson,
  loadCsv,
  loadYamlAsJs,
  loadTsv,
  getFileExtension
} from '../fileSystem'
import { Title } from '../vscode/title'
import { Toast } from '../vscode/toast'

const mockedPickFile = jest.mocked(pickFile)
const mockedLoadJson = jest.mocked(loadJson)
const mockedLoadCsv = jest.mocked(loadCsv)
const mockedLoadYaml = jest.mocked(loadYamlAsJs)
const mockedLoadTsv = jest.mocked(loadTsv)
const mockedGetFileExt = jest.mocked(getFileExtension)
const mockedQuickPickOne = jest.mocked(quickPickOne)
const mockedToast = jest.mocked(Toast)
const mockedShowError = jest.fn()
mockedToast.showError = mockedShowError

jest.mock('../fileSystem')
jest.mock('../vscode/resourcePicker')
jest.mock('../vscode/quickPick')

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetFileExt.mockImplementation(file => '.' + file.split('.').pop())
})

const mockValidData = [
  {
    actual: 8,
    prob: 0.5915647149085999
  },
  {
    actual: 6,
    prob: 0.5553836226463318
  },
  {
    actual: 5,
    prob: 0.18809230625629425
  },
  {
    actual: 1,
    prob: 0.43885940313339233
  },
  {
    actual: 4,
    prob: 0.2965667247772217
  }
]

describe('pickPlotConfiguration', () => {
  it('should let user pick from files with accepted data types', async () => {
    mockedPickFile.mockResolvedValueOnce('file.json')
    mockedLoadJson.mockReturnValueOnce(mockValidData)

    await pickPlotConfiguration()

    expect(mockedPickFile).toHaveBeenCalledWith(Title.SELECT_PLOT_DATA, {
      filters: {
        'Data Formats': ['json', 'csv', 'tsv', 'yaml']
      },
      openLabel: 'Select'
    })
  })

  it('should parse chosen data file', async () => {
    mockedLoadJson.mockReturnValueOnce(mockValidData)
    mockedLoadCsv.mockResolvedValueOnce(mockValidData)
    mockedLoadJson.mockReturnValueOnce(mockValidData)
    mockedLoadTsv.mockResolvedValueOnce(mockValidData)
    mockedLoadYaml.mockReturnValueOnce(mockValidData)
    mockedPickFile
      .mockResolvedValueOnce('file.json')
      .mockResolvedValueOnce('file.csv')
      .mockResolvedValueOnce('file.tsv')
      .mockResolvedValueOnce('file.yaml')

    await pickPlotConfiguration()

    expect(mockedLoadJson).toHaveBeenCalledWith('file.json')

    await pickPlotConfiguration()

    expect(mockedLoadCsv).toHaveBeenCalledWith('file.csv')

    await pickPlotConfiguration()

    expect(mockedLoadTsv).toHaveBeenCalledWith('file.tsv')

    await pickPlotConfiguration()

    expect(mockedLoadYaml).toHaveBeenCalledWith('file.yaml')
  })

  it('should return early if user does not select a file', async () => {
    mockedPickFile.mockResolvedValueOnce(undefined)

    const result = await pickPlotConfiguration()

    expect(result).toStrictEqual(undefined)
  })

  const failedToParseMessage =
    'Failed to find field options for plot data. Is your file following DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'

  it('should show a toast message if file fails to parse', async () => {
    mockedPickFile.mockResolvedValueOnce('file.csv')
    mockedLoadCsv.mockReturnValueOnce(undefined)

    const result = await pickPlotConfiguration()

    expect(result).toStrictEqual(undefined)
    expect(mockedShowError).toHaveBeenCalledTimes(1)
    expect(mockedShowError).toHaveBeenCalledWith(failedToParseMessage)
  })

  it('should show a toast message if fields are not found within a file', async () => {
    mockedPickFile.mockResolvedValue('file.yaml')
    const invalidValues: unknown[] = [
      'string',
      13,
      [],
      ['array', 'of', 'strings'],
      [1, 2, 3],
      [{ field1: 'only one field' }],
      {},
      { val: undefined },
      { val: [] },
      { val: { field1: {} } },
      { val: [{ field1: 'only one field' }] },
      { field1: 123, field2: [{ field1: 1, field2: 2 }] }
    ]

    let result

    for (const [ind, invalidVal] of invalidValues.entries()) {
      mockedLoadYaml.mockReturnValueOnce(invalidVal)

      result = await pickPlotConfiguration()

      expect(result).toStrictEqual(undefined)
      expect(mockedShowError).toHaveBeenCalledTimes(1 + ind)
      expect(mockedShowError).toHaveBeenCalledWith(failedToParseMessage)
    }
  })

  it('should parse fields from valid data files', async () => {
    mockedPickFile.mockResolvedValue('file.yaml')
    const invalidValues: unknown[] = [
      [{ field1: 1, field2: 2 }],
      [
        { field1: 1, field2: 2, field3: 1, field4: 2 },
        { field1: 1, field2: 2, field3: 1, field4: 2 }
      ],
      { field1: [{ field1: 1, field2: 2 }] }
    ]

    for (const [ind, val] of invalidValues.entries()) {
      mockedLoadYaml.mockReturnValueOnce(val)

      await pickPlotConfiguration()

      expect(mockedShowError).not.toHaveBeenCalledTimes(1)
      expect(mockedQuickPickOne).toHaveBeenCalledTimes(ind + 1)
    }
  })

  it('should let user pick a template, x field, and y field', async () => {
    mockedPickFile.mockResolvedValueOnce('file.json')
    mockedLoadJson.mockReturnValueOnce(mockValidData)
    mockedQuickPickOne
      .mockResolvedValueOnce('simple')
      .mockResolvedValueOnce('actual')
      .mockResolvedValueOnce('prob')

    const result = await pickPlotConfiguration()

    expect(mockedQuickPickOne).toHaveBeenNthCalledWith(
      1,
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
    expect(mockedQuickPickOne).toHaveBeenNthCalledWith(
      2,
      ['actual', 'prob'],
      'Pick a Metric for X'
    )
    expect(mockedQuickPickOne).toHaveBeenNthCalledWith(
      3,
      ['prob'],
      'Pick a Metric for Y'
    )
    expect(result).toStrictEqual({
      dataFile: 'file.json',
      template: 'simple',
      x: 'actual',
      y: 'prob'
    })
  })

  it('should return early if user does not pick a template', async () => {
    mockedPickFile.mockResolvedValueOnce('file.json')
    mockedLoadJson.mockReturnValueOnce(mockValidData)
    mockedQuickPickOne.mockResolvedValueOnce(undefined)

    const result = await pickPlotConfiguration()

    expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickOne).toHaveBeenNthCalledWith(
      1,
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

    expect(result).toStrictEqual(undefined)
  })

  it('should return early if user does not pick a x field', async () => {
    mockedPickFile.mockResolvedValueOnce('file.json')
    mockedLoadJson.mockReturnValueOnce(mockValidData)
    mockedQuickPickOne
      .mockResolvedValueOnce('simple')
      .mockResolvedValueOnce(undefined)

    const result = await pickPlotConfiguration()

    expect(mockedQuickPickOne).toHaveBeenCalledTimes(2)
    expect(mockedQuickPickOne).toHaveBeenNthCalledWith(
      1,
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
    expect(mockedQuickPickOne).toHaveBeenNthCalledWith(
      2,
      ['actual', 'prob'],
      'Pick a Metric for X'
    )
    expect(result).toStrictEqual(undefined)
  })

  it('should return early if user does not pick a y field', async () => {
    mockedPickFile.mockResolvedValueOnce('file.json')
    mockedLoadJson.mockReturnValueOnce(mockValidData)
    mockedQuickPickOne
      .mockResolvedValueOnce('simple')
      .mockResolvedValueOnce('actual')
      .mockResolvedValueOnce(undefined)

    const result = await pickPlotConfiguration()

    expect(mockedQuickPickOne).toHaveBeenNthCalledWith(
      1,
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
    expect(mockedQuickPickOne).toHaveBeenNthCalledWith(
      2,
      ['actual', 'prob'],
      'Pick a Metric for X'
    )
    expect(mockedQuickPickOne).toHaveBeenNthCalledWith(
      3,
      ['prob'],
      'Pick a Metric for Y'
    )
    expect(result).toStrictEqual(undefined)
  })
})
