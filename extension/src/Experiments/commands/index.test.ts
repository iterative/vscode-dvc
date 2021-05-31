import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { ExperimentsTable, Experiments } from '..'
import { Config } from '../../Config'
import { quickPickOne } from '../../vscode/quickPick'
import { CliReader } from '../../cli/reader'
import { pickExperimentName } from './quickPick'

const mockedShowWebview = jest.fn()
const mockedDisposable = mocked(Disposable)
const mockedDvcRoot = '/my/dvc/root'
const mockedGetDefaultProject = jest.fn()
const mockedQuickPickOne = mocked(quickPickOne)
const mockedPickExperimentName = mocked(pickExperimentName)
const mockedConfig = ({
  getDefaultProject: mockedGetDefaultProject
} as unknown) as Config

jest.mock('@hediet/std/disposable')
jest.mock('../../vscode/quickPick')
jest.mock('./quickPick')

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValueOnce(({
    track: function<T>(disposable: T): T {
      return disposable
    }
  } as unknown) as (() => void) & Disposer)
})

describe('Experiments', () => {
  describe('getExpNameThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedPickExperimentName.mockResolvedValueOnce('exp-123')

      const experiments = new Experiments(
        mockedConfig,
        ({ experimentListCurrent: jest.fn() } as unknown) as CliReader,
        {
          '/my/dvc/root': ({
            showWebview: mockedShowWebview,
            getDvcRoot: () => mockedDvcRoot
          } as unknown) as ExperimentsTable,
          '/my/fun/dvc/root': ({
            showWebview: jest.fn(),
            getDvcRoot: () => '/my/fun/dvc/root'
          } as unknown) as ExperimentsTable
        }
      )

      const mockedExpFunc = jest.fn()
      await experiments.getExpNameThenRun(mockedExpFunc)

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedPickExperimentName).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot, 'exp-123')
    })

    it('should not call the function if a project is not picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      const experiments = new Experiments(mockedConfig, {} as CliReader, {
        '/my/dvc/root': ({
          showWebview: mockedShowWebview,
          getDvcRoot: () => mockedDvcRoot
        } as unknown) as ExperimentsTable,
        '/my/mono/dvc/root': ({
          showWebview: jest.fn(),
          getDvcRoot: () => '/my/mono/dvc/root'
        } as unknown) as ExperimentsTable
      })

      const mockedExpFunc = jest.fn()
      await experiments.getExpNameThenRun(mockedExpFunc)

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedExpFunc).not.toBeCalled()
    })
  })

  describe('getCwdAndQuickPickThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked and the quick pick returns a list', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      const experiments = new Experiments(mockedConfig, {} as CliReader, {
        '/my/dvc/root': ({
          showWebview: mockedShowWebview,
          getDvcRoot: () => mockedDvcRoot
        } as unknown) as ExperimentsTable,
        '/my/fun/dvc/root': ({
          showWebview: jest.fn(),
          getDvcRoot: () => '/my/fun/dvc/root'
        } as unknown) as ExperimentsTable
      })

      const mockedExpFunc = jest.fn()
      const mockedPickedOptions = ['a', 'b', 'c']
      const mockedQuickPick = jest
        .fn()
        .mockResolvedValueOnce(mockedPickedOptions)
      await experiments.getCwdAndQuickPickThenRun<string[]>(
        mockedExpFunc,
        mockedQuickPick
      )

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedQuickPick).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot, mockedPickedOptions)
    })

    it('should not call the function or ask for quick picks if a project is not picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      const experiments = new Experiments(mockedConfig, {} as CliReader, {
        '/my/dvc/root': ({
          showWebview: mockedShowWebview,
          getDvcRoot: () => mockedDvcRoot
        } as unknown) as ExperimentsTable,
        '/moi/dvc/root': ({
          showWebview: jest.fn(),
          getDvcRoot: () => '/moi/root'
        } as unknown) as ExperimentsTable
      })

      const mockedExpFunc = jest.fn()
      const mockedQuickPick = jest.fn()
      await experiments.getCwdAndQuickPickThenRun(
        mockedExpFunc,
        mockedQuickPick
      )

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedQuickPick).not.toBeCalled()
      expect(mockedExpFunc).not.toBeCalled()
    })

    it('should not call the function if quick picks are not provided', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(mockedDvcRoot)
      mockedPickExperimentName.mockResolvedValueOnce('exp-789')

      const experiments = new Experiments(mockedConfig, {} as CliReader, {
        '/my/dvc/root': ({
          showWebview: mockedShowWebview,
          getDvcRoot: () => mockedDvcRoot
        } as unknown) as ExperimentsTable,
        '/my/mocked/dvc/root': ({
          showWebview: jest.fn(),
          getDvcRoot: () => '/my/mocked/dvc/root'
        } as unknown) as ExperimentsTable
      })

      const mockedExpFunc = jest.fn()
      const mockedQuickPick = jest.fn().mockResolvedValueOnce(undefined)
      await experiments.getCwdAndQuickPickThenRun(
        mockedExpFunc,
        mockedQuickPick
      )

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).not.toBeCalled()
      expect(mockedQuickPick).toBeCalledTimes(1)
      expect(mockedExpFunc).not.toBeCalled()
    })
  })
})
