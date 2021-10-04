import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { Experiments } from '.'
import { WorkspaceExperiments } from './workspace'
import { pickExperimentName } from './quickPick'
import { quickPickOne } from '../vscode/quickPick'
import { Config } from '../config'
import {
  CommandId,
  AvailableCommands,
  InternalCommands
} from '../commands/internal'
import { getInput } from '../vscode/inputBox'
import { buildMockMemento } from '../test/util'
import { OutputChannel } from '../vscode/outputChannel'

const mockedShowWebview = jest.fn()
const mockedDisposable = mocked(Disposable)
const mockedDvcRoot = '/my/dvc/root'
const mockedOtherDvcRoot = '/my/fun/dvc/root'
const mockedQuickPickOne = mocked(quickPickOne)
const mockedPickExperimentName = mocked(pickExperimentName)
const mockedGetInput = mocked(getInput)
const mockedRun = jest.fn()
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
  const mockedInternalCommands = new InternalCommands(
    {} as Config,
    {
      show: jest.fn()
    } as unknown as OutputChannel
  )

  const mockedCommandId = 'mockedExpFunc' as CommandId
  mockedInternalCommands.registerCommand(mockedCommandId, (...args) =>
    mockedExpFunc(...args)
  )

  mockedInternalCommands.registerCommand(
    AvailableCommands.EXPERIMENT_LIST_CURRENT,
    jest.fn()
  )

  mockedInternalCommands.registerCommand(
    AvailableCommands.EXPERIMENT_RUN,
    (...args) => mockedRun(...args)
  )

  const workspaceExperiments = new WorkspaceExperiments(
    mockedInternalCommands,
    buildMockMemento(),
    {
      '/my/dvc/root': {
        getDvcRoot: () => mockedDvcRoot,
        showWebview: mockedShowWebview
      } as unknown as Experiments,
      '/my/fun/dvc/root': {
        getDvcRoot: () => mockedOtherDvcRoot,
        showWebview: jest.fn()
      } as unknown as Experiments
    }
  )

  describe('getCwdThenRun', () => {
    it('should call the correct function with the correct parameters if a project is picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot)
    })

    it('should not call the function if a project is not picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedExpFunc).not.toBeCalled()
    })
  })

  describe('getExpNameThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedPickExperimentName.mockResolvedValueOnce('exp-123')

      await workspaceExperiments.getExpNameThenRun(mockedCommandId)

      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedPickExperimentName).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot, 'exp-123')
    })

    it('should not call the function if a project is not picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await workspaceExperiments.getExpNameThenRun(mockedCommandId)

      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedExpFunc).not.toBeCalled()
    })
  })

  describe('getCwdAndQuickPickThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked and the quick pick returns a list', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      const mockedPickedOptions = ['a', 'b', 'c']
      const mockedQuickPick = jest
        .fn()
        .mockResolvedValueOnce(mockedPickedOptions)
      await workspaceExperiments.getCwdAndQuickPickThenRun(
        mockedCommandId,
        mockedQuickPick
      )

      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedQuickPick).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(
        mockedDvcRoot,
        ...mockedPickedOptions
      )
    })

    it('should not call the function or ask for quick picks if a project is not picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(undefined)
      const mockedQuickPick = jest.fn()

      await workspaceExperiments.getCwdAndQuickPickThenRun(
        mockedCommandId,
        mockedQuickPick
      )

      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedQuickPick).not.toBeCalled()
      expect(mockedExpFunc).not.toBeCalled()
    })

    it('should not call the function if quick picks are not provided', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      const mockedQuickPick = jest.fn().mockResolvedValueOnce(undefined)

      await workspaceExperiments.getCwdAndQuickPickThenRun(
        mockedCommandId,
        mockedQuickPick
      )

      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedQuickPick).toBeCalledTimes(1)
      expect(mockedExpFunc).not.toBeCalled()
    })
  })

  describe('getExpNameAndInputThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked and an input provided', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedPickExperimentName.mockResolvedValueOnce('exp-123')
      mockedGetInput.mockResolvedValueOnce('abc123')

      await workspaceExperiments.getExpNameAndInputThenRun(
        mockedCommandId,
        'enter your password please'
      )

      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedPickExperimentName).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot, 'exp-123', 'abc123')
    })

    it('should not call the function or ask for input if a project is not picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await workspaceExperiments.getExpNameAndInputThenRun(
        mockedCommandId,
        'please name the branch'
      )

      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedGetInput).not.toBeCalled()
      expect(mockedExpFunc).not.toBeCalled()
    })

    it('should not call the function if user input is not provided', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedPickExperimentName.mockResolvedValueOnce('exp-456')
      mockedGetInput.mockResolvedValueOnce(undefined)

      await workspaceExperiments.getExpNameAndInputThenRun(
        mockedCommandId,
        'please enter your bank account number and sort code'
      )

      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedGetInput).toBeCalledTimes(1)
      expect(mockedExpFunc).not.toBeCalled()
    })
  })

  describe('showExperimentsTableThenRun', () => {
    it('should call the runner with the correct args when run experiment is provided', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      await workspaceExperiments.showExperimentsTableThenRun(
        AvailableCommands.EXPERIMENT_RUN
      )

      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedShowWebview).toBeCalledTimes(1)
      expect(mockedRun).toBeCalledWith(mockedDvcRoot)
    })
  })
})
