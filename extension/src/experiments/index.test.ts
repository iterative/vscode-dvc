import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { Experiments } from '.'
import { ExperimentsTable } from './table'
import { pickExperimentName } from './quickPick'
import { runQueued, runReset } from './runner'
import { Config } from '../config'
import { quickPickOne } from '../vscode/quickPick'
import { CliReader } from '../cli/reader'
import { CliRunner } from '../cli/runner'
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
const mockedConfig = {
  getDefaultProject: mockedGetDefaultProject
} as unknown as Config

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
    mockedConfig,
    { experimentListCurrent: jest.fn() } as unknown as CliReader,
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

      const mockedExpFunc = jest.fn()
      await experiments.getCwdThenRun(mockedExpFunc)

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledTimes(1)
      expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot)
    })

    it('should not call the function if a project is not picked', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      const mockedExpFunc = jest.fn()
      await experiments.getCwdThenRun(mockedExpFunc)

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

  describe('getExpNameAndInputThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked and an input provided', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedPickExperimentName.mockResolvedValueOnce('exp-123')
      mockedGetInput.mockResolvedValueOnce('abc123')

      const mockedExpFunc = jest.fn()
      await experiments.getExpNameAndInputThenRun(
        mockedExpFunc,
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

      const mockedExpFunc = jest.fn()
      await experiments.getExpNameAndInputThenRun(
        mockedExpFunc,
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

      const mockedExpFunc = jest.fn()
      await experiments.getExpNameAndInputThenRun(
        mockedExpFunc,
        'please enter your bank account number and sort code'
      )

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).not.toBeCalled()
      expect(mockedGetInput).toBeCalledTimes(1)
      expect(mockedExpFunc).not.toBeCalled()
    })
  })

  describe('showExperimentsTableThenRun', () => {
    it('should call the runner with the correct args when runQueued is provided', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(mockedDvcRoot)

      await experiments.showExperimentsTableThenRun(
        {
          dispose: { track: jest.fn() },
          onDidCompleteProcess: jest.fn(),
          run: mockedRun
        } as unknown as CliRunner,
        runQueued
      )

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).not.toBeCalled()
      expect(mockedShowWebview).toBeCalledTimes(1)
      expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run', '--run-all')
    })

    it('should call the runner with the correct args when runReset is provided', async () => {
      mockedGetDefaultProject.mockReturnValueOnce(undefined)
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      await experiments.showExperimentsTableThenRun(
        {
          dispose: { track: jest.fn() },
          onDidCompleteProcess: jest.fn(),
          run: mockedRun
        } as unknown as CliRunner,
        runReset
      )

      expect(mockedGetDefaultProject).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledTimes(1)
      expect(mockedQuickPickOne).toBeCalledWith(
        [mockedDvcRoot, mockedOtherDvcRoot],
        'Select which project to run command against'
      )
      expect(mockedShowWebview).toBeCalledTimes(1)
      expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run', '--reset')
    })
  })
})
