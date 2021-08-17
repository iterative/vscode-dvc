import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { QuickPickOptions, window } from 'vscode'
import { ExperimentsRepository } from './repository'
import { SortDefinition } from './model/sortBy'
import complexExperimentsOutput from './webview/complex-output-example.json'
import { FilterDefinition, Operator } from './model/filterBy'
import { QuickPickItemWithValue } from '../vscode/quickPick'
import { AvailableCommands, InternalCommands } from '../internalCommands'
import { ResourceLocator } from '../resourceLocator'
import { buildMockMemento } from '../test/util'
import { Config } from '../config'

jest.mock('../fileSystem/watcher', () => ({
  onDidChangeFileSystem: () => ({ isReady: () => Promise.resolve() })
}))
jest.mock('@hediet/std/disposable', () => ({
  Disposable: {
    fn: () => ({ track: (tracked: unknown) => tracked })
  }
}))
jest.mock('vscode')

const mockedShowQuickPick = mocked<
  (
    items: QuickPickItemWithValue[],
    options: QuickPickOptions
  ) => Thenable<
    | QuickPickItemWithValue[]
    | QuickPickItemWithValue
    | string
    | undefined
    | unknown
  >
>(window.showQuickPick)

beforeEach(() => {
  jest.resetAllMocks()
})

const params = 'params'
const paramsYaml = 'params.yaml'
const paramsYamlPath = join(params, paramsYaml)
const epochsParamPath = join(paramsYamlPath, 'epochs')
const epochsParam = {
  group: params,
  hasChildren: false,
  maxNumber: 5,
  maxStringLength: 1,
  minNumber: 2,
  name: 'epochs',
  parentPath: paramsYamlPath,
  path: epochsParamPath,
  types: ['number']
}

const paramsYamlParam = {
  group: params,
  hasChildren: true,
  name: paramsYaml,
  parentPath: params,
  path: paramsYamlPath
}
const exampleParamsAndMetrics = [epochsParam, paramsYamlParam]

describe('ExperimentsRepository', () => {
  describe('persisted state', () => {
    const mockedInternalCommands = new InternalCommands({
      getDefaultProject: jest.fn()
    } as unknown as Config)
    mockedInternalCommands.registerCommand(
      AvailableCommands.EXPERIMENT_SHOW,
      () => Promise.resolve(complexExperimentsOutput)
    )
    it('Properly initializes with no persisted state', async () => {
      const testRepository = new ExperimentsRepository(
        'test',
        mockedInternalCommands,
        {} as ResourceLocator,
        buildMockMemento()
      )
      await expect(testRepository.isReady()).resolves.toBe(undefined)
    })
    it('Properly initializes with persisted state', async () => {
      const sortDefinitions: SortDefinition[] = [
        { descending: false, path: 'params/params.yaml/test' },
        { descending: true, path: 'params/params.yaml/other' }
      ]
      const filterDefinition = {
        operator: Operator.EQUAL,
        path: 'params/params.yaml/test',
        value: 1
      }
      const filterMapEntries: [string, FilterDefinition][] = [
        ['filterId', filterDefinition]
      ]
      const mockMemento = buildMockMemento({
        'filterBy:test': filterMapEntries,
        'sortBy:test': sortDefinitions
      })
      const mementoSpy = jest.spyOn(mockMemento, 'get')
      const testRepository = new ExperimentsRepository(
        'test',
        mockedInternalCommands,
        {} as ResourceLocator,
        mockMemento
      )
      await expect(testRepository.isReady()).resolves.toBe(undefined)
      expect(mementoSpy).toBeCalledWith('sortBy:test', [])
      expect(mementoSpy).toBeCalledWith('filterBy:test', [])
      expect(testRepository.getSorts()).toEqual(sortDefinitions)
      expect(testRepository.getFilters()).toEqual([filterDefinition])
    })
  })

  describe('pickSort', () => {
    const mockGetTerminalNodes = jest.fn()

    const pickSort = ExperimentsRepository.prototype.pickSort.bind({
      paramsAndMetrics: {
        getTerminalNodes: mockGetTerminalNodes
      }
    })

    it('should not invoke a quickPick if passed undefined', async () => {
      mockGetTerminalNodes.mockReturnValueOnce(undefined)
      const resolvedPromise = await pickSort()
      expect(mockedShowQuickPick).not.toBeCalled()
      expect(resolvedPromise).toBe(undefined)
    })

    it('should not invoke a quickPick if an empty array', async () => {
      mockGetTerminalNodes.mockReturnValueOnce([])
      const resolvedPromise = await pickSort()
      expect(mockedShowQuickPick).not.toBeCalled()
      expect(resolvedPromise).toBe(undefined)
    })

    it('should resolve with no value if canceled at param or metric select', async () => {
      mockGetTerminalNodes.mockReturnValueOnce(exampleParamsAndMetrics)
      mockedShowQuickPick.mockResolvedValueOnce(undefined)
      expect(await pickSort()).toBe(undefined)
      expect(mockedShowQuickPick).toBeCalledTimes(1)
    })

    it('should resolve with no value if canceled at order select', async () => {
      mockGetTerminalNodes.mockReturnValueOnce(exampleParamsAndMetrics)
      mockedShowQuickPick.mockResolvedValueOnce({
        value: epochsParam
      } as unknown)
      mockedShowQuickPick.mockResolvedValueOnce(undefined)
      expect(await pickSort()).toBe(undefined)
      expect(mockedShowQuickPick).toBeCalledTimes(2)
    })

    it('should invoke a descending sort with the expected quickPick calls', async () => {
      mockGetTerminalNodes.mockReturnValueOnce(exampleParamsAndMetrics)
      mockedShowQuickPick.mockResolvedValueOnce({
        value: epochsParam
      } as unknown)
      mockedShowQuickPick.mockResolvedValueOnce({ value: false } as unknown)
      const resolvedPromise = await pickSort()
      expect(mockedShowQuickPick).toBeCalledTimes(2)
      expect(mockedShowQuickPick).toBeCalledWith(
        [
          { label: 'Ascending', value: false },
          { label: 'Descending', value: true }
        ],
        { title: 'Select a direction to sort in' }
      )
      expect(resolvedPromise).toEqual({
        descending: false,
        path: epochsParamPath
      })
    })

    it('should invoke an ascending sort with the expected quickPick calls', async () => {
      mockGetTerminalNodes.mockReturnValueOnce(exampleParamsAndMetrics)
      mockedShowQuickPick.mockResolvedValueOnce({
        value: paramsYamlParam
      } as unknown)
      mockedShowQuickPick.mockResolvedValueOnce({ value: false } as unknown)
      const resolvedPromise = await pickSort()
      expect(mockedShowQuickPick).toBeCalledTimes(2)
      expect(resolvedPromise).toEqual({
        descending: false,
        path: paramsYamlPath
      })
    })
  })
})
