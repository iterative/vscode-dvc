import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { QuickPickOptions, window } from 'vscode'
import { ExperimentsRepository } from './repository'
import { QuickPickItemWithValue } from '../vscode/quickPick'

jest.mock('@hediet/std/disposable')
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
  const mockGetTerminalNodes = jest.fn()
  const pickSort = ExperimentsRepository.prototype.pickSort.bind({
    paramsAndMetrics: {
      getTerminalNodes: mockGetTerminalNodes
    }
  })

  describe('pickSort', () => {
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
