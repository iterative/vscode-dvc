import { mocked } from 'ts-jest/utils'
import { Experiments } from '..'
import { Config } from '../../Config'
import { getDvcRoot } from '../../fileSystem/workspace'
import { getExperimentsThenRun } from './register'

const mockedGetDvcRoot = mocked(getDvcRoot)
const mockedShowWebview = jest.fn()

jest.mock('../../fileSystem/workspace')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getExperimentsThenRun', () => {
  it('should call showWebview when no function or runner are provided', async () => {
    mockedGetDvcRoot.mockResolvedValueOnce('/my/dvc/root')

    const undef = await getExperimentsThenRun(
      {
        '/my/dvc/root': ({
          showWebview: mockedShowWebview
        } as unknown) as Experiments
      },
      {} as Config
    )
    expect(mockedShowWebview).toBeCalledTimes(1)
    expect(undef).toBeUndefined()
  })
})
