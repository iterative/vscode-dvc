import { QuickPickItemKind } from 'vscode'
import { pickPlotConfiguration } from './quickPick'
import { getInput } from '../vscode/inputBox'
import { pickFiles } from '../vscode/resourcePicker'
import { quickPickOne, quickPickValue } from '../vscode/quickPick'
import { getFileExtension, loadDataFiles } from '../fileSystem'
import { Title } from '../vscode/title'
import { Toast } from '../vscode/toast'

const mockedPickFiles = jest.mocked(pickFiles)
const mockedLoadDataFiles = jest.mocked(loadDataFiles)
const mockedGetFileExt = jest.mocked(getFileExtension)
const mockedGetInput = jest.mocked(getInput)
const mockedQuickPickOne = jest.mocked(quickPickOne)
const mockedQuickPickValue = jest.mocked(quickPickValue)
const mockedToast = jest.mocked(Toast)
const mockedShowError = jest.fn()
mockedToast.showError = mockedShowError

jest.mock('../fileSystem')
jest.mock('../vscode/inputBox')
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
    mockedPickFiles.mockResolvedValueOnce(['/file.json'])
    mockedLoadDataFiles.mockResolvedValueOnce([
      { data: mockValidData, file: 'file.json' }
    ])

    await pickPlotConfiguration('/')

    expect(mockedPickFiles).toHaveBeenCalledWith(Title.SELECT_PLOT_DATA, {
      'Data Formats': ['json', 'csv', 'tsv', 'yaml']
    })
  })

  it('should return early if user does not select a file', async () => {
    mockedPickFiles.mockResolvedValueOnce(undefined)

    const result = await pickPlotConfiguration('/')

    expect(result).toStrictEqual(undefined)
  })

  it('should show a toast message if the files are not the same data type', async () => {
    mockedPickFiles.mockResolvedValueOnce(['/file.json', '/file.csv'])

    const twoExtsResult = await pickPlotConfiguration('/')

    expect(twoExtsResult).toStrictEqual(undefined)
    expect(mockedShowError).toHaveBeenCalledTimes(1)
    expect(mockedShowError).toHaveBeenCalledWith(
      'Found files with .json and .csv extensions. Files must be of the same type.'
    )

    mockedPickFiles.mockResolvedValueOnce([
      '/file.json',
      '/file.csv',
      '/file.tsv'
    ])

    const threeExtsResult = await pickPlotConfiguration('/')

    expect(threeExtsResult).toStrictEqual(undefined)
    expect(mockedShowError).toHaveBeenCalledTimes(2)
    expect(mockedShowError).toHaveBeenNthCalledWith(
      2,
      'Found files with .json, .csv, and .tsv extensions. Files must be of the same type.'
    )
  })

  it('should show a toast message if parsing a file failed', async () => {
    mockedPickFiles.mockResolvedValueOnce(['/data.csv'])
    mockedLoadDataFiles.mockResolvedValueOnce([
      { data: [{ field1: 'only one field' }], file: '/results.csv' },
      { data: undefined, file: '/data.csv' }
    ])

    const result = await pickPlotConfiguration('/')

    expect(result).toStrictEqual(undefined)
    expect(mockedShowError).toHaveBeenCalledTimes(1)
    expect(mockedShowError).toHaveBeenCalledWith(
      'Failed to parse data.csv. Does the file contain data and follow the DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'
    )
  })

  it('should show a toast message if an array of objects (with atleast two keys) are not found within a single chosen file', async () => {
    mockedPickFiles.mockResolvedValue(['/file.yaml'])
    const invalidValues: unknown[] = [
      'string',
      13,
      [],
      ['array', 'of', 'strings'],
      [1, 2, 3],
      [{ field1: 'only one field' }],
      [
        {
          field1: 1,
          field2: 2
        },
        { field: 2 }
      ],
      {},
      { val: undefined },
      { val: [] },
      { val: { field1: {} } },
      { val: [{ field1: 'only one field' }] },
      { field1: 123, field2: [{ field1: 1, field2: 2 }] },
      {
        field1: [
          {
            field1: 1,
            field2: 2
          },
          { field1: 1, field2: 2 },
          { field3: 1 }
        ]
      }
    ]

    let result

    for (const [ind, invalidVal] of invalidValues.entries()) {
      mockedLoadDataFiles.mockResolvedValueOnce([
        { data: invalidVal, file: '/file.yaml' }
      ])

      result = await pickPlotConfiguration('/')

      expect(result).toStrictEqual(undefined)
      expect(mockedShowError).toHaveBeenCalledTimes(1 + ind)
      expect(mockedShowError).toHaveBeenCalledWith(
        'file.yaml does not contain enough keys (columns) to generate a plot. Does the file contain data and follow the DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'
      )
    }
  })

  it('should show a toast message if an array of objects (with atleast one key) are not found within multiple chosen files', async () => {
    mockedPickFiles.mockResolvedValueOnce([
      '/file.yaml',
      '/file2.yaml',
      '/file3.yaml'
    ])
    mockedLoadDataFiles.mockResolvedValueOnce([
      { data: { val: [{ field1: 1, field2: 2 }] }, file: '/file.yaml' },
      { data: [], file: '/file2.yaml' },
      { data: { val: 2 }, file: '/file3.yaml' }
    ])

    const result = await pickPlotConfiguration('/')

    expect(result).toStrictEqual(undefined)
    expect(mockedShowError).toHaveBeenCalledTimes(1)
    expect(mockedShowError).toHaveBeenCalledWith(
      'file2.yaml does not contain enough keys (columns) to generate a plot. Does the file contain data and follow the DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'
    )
  })

  it("should show a toast message if the multiple chosen files' object arrays are not the same length", async () => {
    mockedPickFiles.mockResolvedValueOnce(['/file.yaml', '/file2.yaml'])
    mockedLoadDataFiles.mockResolvedValueOnce([
      { data: { val: [{ field1: 1, field2: 2 }] }, file: '/file.yaml' },
      {
        data: {
          val: [
            { field1: 1, field2: 2 },
            { field1: 1, field2: 2 }
          ]
        },
        file: '/file3.yaml'
      }
    ])

    const result = await pickPlotConfiguration('/')

    expect(result).toStrictEqual(undefined)
    expect(mockedShowError).toHaveBeenCalledTimes(1)
    expect(mockedShowError).toHaveBeenCalledWith(
      'All files must have the same array (list) length. See [examples](https://dvc.org/doc/command-reference/plots/show#sourcing-x-and-y-from-different-files) of multiple files being used in DVC plots.'
    )
  })

  it('should parse fields from a valid data file', async () => {
    mockedPickFiles.mockResolvedValue(['/file.yaml'])
    const validValues: unknown[] = [
      [{ field1: 1, field2: 2 }],
      [
        { field1: 1, field2: 2, field3: 1, field4: 2 },
        { field1: 1, field2: 2, field3: 1, field4: 2 }
      ],
      { field1: [{ field1: 1, field2: 2 }] },
      {
        field1: [
          { field1: 1, field2: 2 },
          { field1: 3, field2: 4 }
        ]
      }
    ]

    for (const [ind, val] of validValues.entries()) {
      mockedLoadDataFiles.mockResolvedValueOnce([
        { data: val, file: '/file.yaml' }
      ])

      await pickPlotConfiguration('/')

      expect(mockedShowError).not.toHaveBeenCalled()
      expect(mockedQuickPickOne).toHaveBeenCalledTimes(ind + 1)
    }
  })

  it('should parse fields from multiple valid data files', async () => {
    mockedPickFiles.mockResolvedValueOnce(['/file.yaml', '/file2.yaml'])
    mockedLoadDataFiles.mockResolvedValueOnce([
      { data: { val: [{ field1: 1, field2: 2 }] }, file: '/file.yaml' },
      { data: { val: [{ field1: 1 }] }, file: '/file2.yaml' }
    ])

    const result = await pickPlotConfiguration('/')

    expect(result).toStrictEqual(undefined)
    expect(mockedShowError).not.toHaveBeenCalled()
  })

  it('should let the user pick a template, title, x field, and y field', async () => {
    mockedPickFiles.mockResolvedValueOnce(['/file.json'])
    mockedLoadDataFiles.mockResolvedValueOnce([
      { data: mockValidData, file: '/file.json' }
    ])
    mockedQuickPickOne.mockResolvedValueOnce('simple')
    mockedGetInput.mockResolvedValueOnce('Simple Plot')
    mockedQuickPickValue
      .mockResolvedValueOnce({ file: 'file.json', key: 'actual' })
      .mockResolvedValueOnce({ file: 'file.json', key: 'prob' })

    const result = await pickPlotConfiguration('/')

    expect(mockedGetInput).toHaveBeenCalledWith(
      Title.ENTER_PLOT_TITLE,
      'simple_plot'
    )
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
    expect(mockedQuickPickValue).toHaveBeenNthCalledWith(
      1,
      [
        {
          kind: QuickPickItemKind.Separator,
          label: 'file.json',
          value: undefined
        },
        { label: 'actual', value: { file: 'file.json', key: 'actual' } },
        { label: 'prob', value: { file: 'file.json', key: 'prob' } }
      ],
      { title: Title.SELECT_PLOT_X_METRIC }
    )
    expect(mockedQuickPickValue).toHaveBeenNthCalledWith(
      2,
      [
        {
          kind: QuickPickItemKind.Separator,
          label: 'file.json',
          value: undefined
        },
        { label: 'prob', value: { file: 'file.json', key: 'prob' } }
      ],
      {
        title: Title.SELECT_PLOT_Y_METRIC
      }
    )
    expect(result).toStrictEqual({
      template: 'simple',
      title: 'Simple Plot',
      x: { file: 'file.json', key: 'actual' },
      y: { file: 'file.json', key: 'prob' }
    })
  })

  it('should let the user pick a x field and y field from multiple files', async () => {
    mockedPickFiles.mockResolvedValueOnce(['/file.json', '/file2.json'])
    mockedLoadDataFiles.mockResolvedValueOnce([
      { data: mockValidData, file: '/file.json' },
      { data: mockValidData, file: '/file2.json' }
    ])
    mockedQuickPickOne.mockResolvedValueOnce('simple')
    mockedGetInput.mockResolvedValueOnce('simple_plot')
    mockedQuickPickValue
      .mockResolvedValueOnce({ file: 'file.json', key: 'actual' })
      .mockResolvedValueOnce({ file: 'file2.json', key: 'prob' })

    const result = await pickPlotConfiguration('/')

    expect(mockedQuickPickValue).toHaveBeenNthCalledWith(
      1,
      [
        {
          kind: QuickPickItemKind.Separator,
          label: 'file.json',
          value: undefined
        },
        { label: 'actual', value: { file: 'file.json', key: 'actual' } },
        { label: 'prob', value: { file: 'file.json', key: 'prob' } },
        {
          kind: QuickPickItemKind.Separator,
          label: 'file2.json',
          value: undefined
        },
        { label: 'actual', value: { file: 'file2.json', key: 'actual' } },
        { label: 'prob', value: { file: 'file2.json', key: 'prob' } }
      ],
      { title: Title.SELECT_PLOT_X_METRIC }
    )
    expect(mockedQuickPickValue).toHaveBeenNthCalledWith(
      2,
      [
        {
          kind: QuickPickItemKind.Separator,
          label: 'file.json',
          value: undefined
        },
        { label: 'prob', value: { file: 'file.json', key: 'prob' } },
        {
          kind: QuickPickItemKind.Separator,
          label: 'file2.json',
          value: undefined
        },
        { label: 'actual', value: { file: 'file2.json', key: 'actual' } },
        { label: 'prob', value: { file: 'file2.json', key: 'prob' } }
      ],
      {
        title: Title.SELECT_PLOT_Y_METRIC
      }
    )
    expect(result).toStrictEqual({
      template: 'simple',
      title: 'simple_plot',
      x: { file: 'file.json', key: 'actual' },
      y: { file: 'file2.json', key: 'prob' }
    })
  })

  it('should return early if the user does not pick a template', async () => {
    mockedPickFiles.mockResolvedValueOnce(['/file.json'])
    mockedLoadDataFiles.mockResolvedValueOnce([
      { data: mockValidData, file: 'file.json' }
    ])
    mockedQuickPickOne.mockResolvedValueOnce(undefined)

    const result = await pickPlotConfiguration('/')

    expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)

    expect(result).toStrictEqual(undefined)
  })

  it('should return early if the user does not pick a title', async () => {
    mockedPickFiles.mockResolvedValueOnce(['/file.json'])
    mockedLoadDataFiles.mockResolvedValueOnce([
      { data: mockValidData, file: 'file.json' }
    ])
    mockedQuickPickOne.mockResolvedValueOnce('linear')
    mockedGetInput.mockResolvedValueOnce(undefined)

    const result = await pickPlotConfiguration('/')

    expect(mockedGetInput).toHaveBeenCalledTimes(1)
    expect(result).toStrictEqual(undefined)
  })

  it('should return early if the user does not pick a x field', async () => {
    mockedPickFiles.mockResolvedValueOnce(['/file.json'])
    mockedLoadDataFiles.mockResolvedValueOnce([
      { data: mockValidData, file: 'file.json' }
    ])
    mockedQuickPickOne.mockResolvedValueOnce('simple')
    mockedGetInput.mockResolvedValueOnce('simple_plot')
    mockedQuickPickValue.mockResolvedValueOnce(undefined)

    const result = await pickPlotConfiguration('/')

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(result).toStrictEqual(undefined)
  })

  it('should return early if the user does not pick a y field', async () => {
    mockedPickFiles.mockResolvedValueOnce(['/file.json'])
    mockedLoadDataFiles.mockResolvedValueOnce([
      { data: mockValidData, file: 'file.json' }
    ])
    mockedQuickPickOne.mockResolvedValueOnce('simple')
    mockedGetInput.mockResolvedValueOnce('simple_plot')
    mockedQuickPickValue
      .mockResolvedValueOnce('actual')
      .mockResolvedValueOnce(undefined)

    const result = await pickPlotConfiguration('/')

    expect(mockedQuickPickValue).toHaveBeenCalledTimes(2)
    expect(result).toStrictEqual(undefined)
  })
})
