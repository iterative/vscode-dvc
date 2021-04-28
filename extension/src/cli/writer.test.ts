import { mocked } from 'ts-jest/utils'
import { getProcessEnv } from '../env'
import { runProcess } from '../processExecution'
import { checkout } from './writer'

jest.mock('../processExecution')
jest.mock('../env')

const mockedRunProcess = mocked(runProcess)
const mockedGetProcessEnv = mocked(getProcessEnv)
const mockedEnv = {
  PATH: '/some/special/path'
}

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValueOnce(mockedEnv)
})

describe('checkout', () => {
  it('should call runProcess with the correct parameters', async () => {
    const fsPath = __dirname
    const stdout = `M       model.pt\nM       logs/\n`
    mockedRunProcess.mockResolvedValueOnce(stdout)

    const output = await checkout({
      cliPath: 'dvc',
      cwd: fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedRunProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['checkout'],
      cwd: fsPath,
      env: mockedEnv
    })
  })
})
