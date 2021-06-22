import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { Experiments } from '.'
import { ExperimentsTable } from './table'
import { pickExperimentName } from './quickPick'
import { quickPickOne } from '../vscode/quickPick'
import { getInput } from '../vscode/inputBox'
import { AvailableCommands, InternalCommands } from '../internalCommands'

const mockedShowWebview = jest.fn()
const mockedDisposable = mocked(Disposable)
const mockedDvcRoot = '/my/dvc/root'
const mockedOtherDvcRoot = '/my/fun/dvc/root'
const mockedGetDefaultProject = jest.fn()
const mockedQuickPickOne = mocked(quickPickOne)
const mockedPickExperimentName = mocked(pickExperimentName)
const mockedGetInput = mocked(getInput)
const mockedRun = jest.fn()
const mockedPrompt = 'Select which project to run command against'
const mockedGetDefaultOrPickProject = (args: string[]) => {
  if (args.length === 1) {
    return args[0]
  }
  return mockedGetDefaultProject() || mockedQuickPickOne(args, mockedPrompt)
}
const mockedExpFunc = jest.fn()

jest.mock('@hediet/std/disposable')
jest.mock('../vscode/quickPick')
jest.mock('../vscode/inputBox')
jest.mock('./quickPick')

beforeEach(() => {
  jest.resetAllMocks()
  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)
})

describe('Experiments', () => {
  const experiments = new Experiments(
    {
      executeCommand: (name: string, ...args: string[]) => {
        if (name === 'mockedExpFunc') {
          return mockedExpFunc(...args)
        }

        if (name === 'experimentListCurrent') {
          return jest.fn()
        }

        if (name === 'pickExperimentName') {
          return mockedPickExperimentName(Promise.resolve(args))
        }

        if (name === 'getDefaultOrPickProject') {
          return mockedGetDefaultOrPickProject(args)
        }

        if (['runExperiment', 'runExperimentReset'].includes(name)) {
          return mockedRun(...args)
        }
      },
      registerCommand: jest.fn()
    } as unknown as InternalCommands,
    {
      '/my/dvc/root': {
        getDvcRoot: () => mockedDvcRoot,
        showWebview: mockedShowWebview
      } as unknown as ExperimentsTable,
      '/my/fun/dvc/root': {
        getDvcRoot: () => mockedOtherDvcRoot,
        showWebview: jest.fn()
      } as unknown as ExperimentsTable
    }
  )

  describe('getCwdThenRun', () => {
    it('should call the correct function with the correct parameters if a project is picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      await experiments.getCwdThenRun('mockedExpFunc' as AvailableCommands)

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot)
    })

    it('should not call the function if a project is not picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await experiments.getCwdThenRun('mockedExpFunc' as AvailableCommands)

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedExpFunc).not.toBeCalled()
    })
  })

  describe('getExpNameThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedPickExperimentName.mockResolvedValueOnce('exp-123')

      await experiments.getExpNameThenRun('mockedExpFunc' as AvailableCommands)

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedPickExperimentName).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot, 'exp-123')
    })

    it('should not call the function if a project is not picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await experiments.getExpNameThenRun('mockedExpFunc' as AvailableCommands)

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedExpFunc).not.toBeCalled()
    })
  })

  describe('getCwdAndQuickPickThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked and the quick pick returns a list', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      const mockedPickedOptions = ['a', 'b', 'c']
      const mockedQuickPick = jest
        .fn()
        .mockResolvedValueOnce(mockedPickedOptions)
      await experiments.getCwdAndQuickPickThenRun(
        'mockedExpFunc' as AvailableCommands,
        mockedQuickPick
      )

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedQuickPick).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(
        mockedDvcRoot,
        ...mockedPickedOptions
      )
    })

    it('should not call the function or ask for quick picks if a project is not picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(undefined)
      const mockedQuickPick = jest.fn()
      await experiments.getCwdAndQuickPickThenRun(
        'mockedExpFunc' as AvailableCommands,
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

      const mockedQuickPick = jest.fn().mockResolvedValueOnce(undefined)
      await experiments.getCwdAndQuickPickThenRun(
        'mockedExpFunc' as AvailableCommands,
        mockedQuickPick
      )

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).not.toBeCalled()
      expect(mockedQuickPick).toBeCalledTimes(1)
      expect(mockedExpFunc).not.toBeCalled()
    })
  })

  describe('getExpNameAndInputThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked and an input provided', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedPickExperimentName.mockResolvedValueOnce('exp-123')
      mockedGetInput.mockResolvedValueOnce('abc123')

      await experiments.getExpNameAndInputThenRun(
        'mockedExpFunc' as AvailableCommands,
        'enter your password please'
      )

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedPickExperimentName).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot, 'exp-123', 'abc123')
    })

    it('should not call the function or ask for input if a project is not picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await experiments.getExpNameAndInputThenRun(
        'mockedExpFunc' as AvailableCommands,
        'please name the branch'
      )

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedGetInput).not.toBeCalled()
      expect(mockedExpFunc).not.toBeCalled()
    })

    it('should not call the function if user input is not provided', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(mockedDvcRoot)
      mockedPickExperimentName.mockResolvedValueOnce('exp-456')
      mockedQuickPickOne.mockResolvedValueOnce(undefined)
      mockedGetInput.mockResolvedValueOnce(undefined)

      await experiments.getExpNameAndInputThenRun(
        'mockedExpFunc' as AvailableCommands,
        'please enter your bank account number and sort code'
      )

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).not.toBeCalled()
      expect(mockedGetInput).toBeCalledTimes(1)
      expect(mockedExpFunc).not.toBeCalled()
    })
  })

  describe('showExperimentsTableThenRun', () => {
    it('should call the runner with the correct args when run experiment is provided', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(mockedDvcRoot)

      await experiments.showExperimentsTableThenRun(
        AvailableCommands.EXPERIMENT_RUN
      )

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).not.toBeCalled()
      expect(mockedShowWebview).toBeCalledTimes(1)
      expect(mockedRun).toBeCalledWith(mockedDvcRoot)
    })
  })
})
