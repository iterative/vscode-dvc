import { join } from 'path'
import { collectRunningExperimentPids } from './collect'
import { getPidFromFile } from '../../fileSystem'
import {
  DVCLIVE_ONLY_RUNNING_SIGNAL_FILE,
  EXP_RWLOCK_FILE
} from '../../cli/dvc/constants'

jest.mock('../../fileSystem')

const mockedGetPidFromFile = jest.mocked(getPidFromFile)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('collectRunningExperimentPids', () => {
  it('should exclude undefined from the final result', async () => {
    mockedGetPidFromFile
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(1234)

    const mockedDvcRoot = join('mock', 'root')

    expect(await collectRunningExperimentPids([mockedDvcRoot])).toStrictEqual([
      1234
    ])

    expect(mockedGetPidFromFile).toHaveBeenCalledTimes(2)
    expect(mockedGetPidFromFile).toHaveBeenCalledWith(
      join(mockedDvcRoot, DVCLIVE_ONLY_RUNNING_SIGNAL_FILE)
    )
    expect(mockedGetPidFromFile).toHaveBeenCalledWith(
      join(mockedDvcRoot, EXP_RWLOCK_FILE)
    )
  })

  it("should collect the pid of processes which are located in each repository's files", async () => {
    mockedGetPidFromFile
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)

    const mockedFirstDvcRoot = join('mock', 'root', '1')
    const mockedSecondDvcRoot = join('mock', 'root', '2')

    expect(
      await collectRunningExperimentPids([
        mockedFirstDvcRoot,
        mockedSecondDvcRoot
      ])
    ).toStrictEqual([1, 2, 3, 4])

    expect(mockedGetPidFromFile).toHaveBeenCalledTimes(4)
    expect(mockedGetPidFromFile).toHaveBeenCalledWith(
      join(mockedFirstDvcRoot, DVCLIVE_ONLY_RUNNING_SIGNAL_FILE)
    )
    expect(mockedGetPidFromFile).toHaveBeenCalledWith(
      join(mockedFirstDvcRoot, EXP_RWLOCK_FILE)
    )
    expect(mockedGetPidFromFile).toHaveBeenCalledWith(
      join(mockedSecondDvcRoot, DVCLIVE_ONLY_RUNNING_SIGNAL_FILE)
    )
    expect(mockedGetPidFromFile).toHaveBeenCalledWith(
      join(mockedSecondDvcRoot, EXP_RWLOCK_FILE)
    )
  })
})
