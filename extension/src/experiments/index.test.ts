import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { Experiments } from '.'
import { ExperimentsRepository } from './repository'
import { pickExperimentName } from './quickPick'
import { quickPickOne } from '../vscode/quickPick'
import { Config } from '../config'
import {
  CommandId,
  AvailableCommands,
  InternalCommands
} from '../internalCommands'
import { getInput } from '../vscode/inputBox'

const mockedShowWebview = jest.fn()
const mockedDisposable = mocked(Disposable)
const mockedDvcRoot = '/my/dvc/root'
const mockedOtherDvcRoot = '/my/fun/dvc/root'
const mockedGetDefaultProject = jest.fn()
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
  const mockedInternalCommands = new InternalCommands({
    getDefaultProject: mockedGetDefaultProject
  } as unknown as Config)

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

  const experiments = new Experiments(mockedInternalCommands, {
    '/my/dvc/root': {
      getDvcRoot: () => mockedDvcRoot,
      showWebview: mockedShowWebview
    } as unknown as ExperimentsRepository,
    '/my/fun/dvc/root': {
      getDvcRoot: () => mockedOtherDvcRoot,
      showWebview: jest.fn()
    } as unknown as ExperimentsRepository
  })

  describe('getCwdThenRun', () => {
    it('should call the correct function with the correct parameters if a project is picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      await experiments.getCwdThenRun(mockedCommandId)

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot)
    })

    it('should not call the function if a project is not picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await experiments.getCwdThenRun(mockedCommandId)

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

      await experiments.getExpNameThenRun(mockedCommandId)

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedPickExperimentName).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot, 'exp-123')
    })

    it('should not call the function if a project is not picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await experiments.getExpNameThenRun(mockedCommandId)

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
        mockedCommandId,
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
        mockedCommandId,
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
        mockedCommandId,
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
        mockedCommandId,
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
        mockedCommandId,
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
        mockedCommandId,
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
