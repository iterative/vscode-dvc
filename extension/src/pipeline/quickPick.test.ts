import { pickPlotConfiguration } from './quickPick'
import { pickFile } from '../vscode/resourcePicker'
import { quickPickOne } from '../vscode/quickPick'
import { getFileExtension, loadDataFile } from '../fileSystem'
import { Title } from '../vscode/title'

const mockedPickFile = jest.mocked(pickFile)
const mockedLoadDataFile = jest.mocked(loadDataFile)
const mockedGetFileExt = jest.mocked(getFileExtension)
const mockedQuickPickOne = jest.mocked(quickPickOne)

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
  it('should let the user pick from files with accepted data types', async () => {
    mockedPickFile.mockResolvedValueOnce('file.json')
    mockedLoadDataFile.mockReturnValueOnce(mockValidData)

    await pickPlotConfiguration()

    expect(mockedPickFile).toHaveBeenCalledWith(Title.SELECT_PLOT_DATA, {
      'Data Formats': ['json', 'csv', 'tsv', 'yaml']
    })
  })

  it('should let the user pick a template, x field, and y field', async () => {
    mockedPickFile.mockResolvedValueOnce('file.json')
    mockedLoadDataFile.mockReturnValueOnce(mockValidData)
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

  it('should return early if the user does not pick a template', async () => {
    mockedPickFile.mockResolvedValueOnce('file.json')
    mockedLoadDataFile.mockReturnValueOnce(mockValidData)
    mockedQuickPickOne.mockResolvedValueOnce(undefined)

    const result = await pickPlotConfiguration()

    expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)

    expect(result).toStrictEqual(undefined)
  })

  it('should return early if the user does not pick a x field', async () => {
    mockedPickFile.mockResolvedValueOnce('file.json')
    mockedLoadDataFile.mockReturnValueOnce(mockValidData)
    mockedQuickPickOne
      .mockResolvedValueOnce('simple')
      .mockResolvedValueOnce(undefined)

    const result = await pickPlotConfiguration()

    expect(mockedQuickPickOne).toHaveBeenCalledTimes(2)
    expect(result).toStrictEqual(undefined)
  })

  it('should return early if the user does not pick a y field', async () => {
    mockedPickFile.mockResolvedValueOnce('file.json')
    mockedLoadDataFile.mockReturnValueOnce(mockValidData)
    mockedQuickPickOne
      .mockResolvedValueOnce('simple')
      .mockResolvedValueOnce('actual')
      .mockResolvedValueOnce(undefined)

    const result = await pickPlotConfiguration()

    expect(mockedQuickPickOne).toHaveBeenCalledTimes(3)
    expect(result).toStrictEqual(undefined)
  })
})
