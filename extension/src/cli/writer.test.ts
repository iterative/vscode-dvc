import { mocked } from 'ts-jest/utils'
import { getProcessEnv } from '../env'
import { runProcess } from '../processExecution'
import { checkout, commit, initializeDirectory } from './writer'

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

describe('commit', () => {
  it('should call execPromise with the correct parameters', async () => {
    const cwd = __dirname
    const stdout = "Updating lock file 'dvc.lock'"
    mockedRunProcess.mockResolvedValueOnce(stdout)

    const output = await commit({
      cliPath: 'dvc',
      cwd,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedRunProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['commit', '-f'],
      cwd,
      env: mockedEnv
    })
  })
})

describe('initializeDirectory', () => {
  it('should call runProcess with the correct parameters', async () => {
    const fsPath = __dirname
    const stdout = `
	  Initialized DVC repository.
	  You can now commit the changes to git.
	  
	  +---------------------------------------------------------------------+
	  |                                                                     |
	  |        DVC has enabled anonymous aggregate usage analytics.         |
	  |     Read the analytics documentation (and how to opt-out) here:     |
	  |             <https://dvc.org/doc/user-guide/analytics>              |
	  |                                                                     |
	  +---------------------------------------------------------------------+
	  
	  What's next?
	  ------------
	  - Check out the documentation: <https://dvc.org/doc>
	  - Get help and share ideas: <https://dvc.org/chat>
	  - Star us on GitHub: <https://github.com/iterative/dvc>`

    mockedRunProcess.mockResolvedValueOnce(stdout)

    const output = await initializeDirectory({
      cliPath: 'dvc',
      cwd: fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedRunProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['init', '--subdir'],
      cwd: fsPath,
      env: mockedEnv
    })
  })
})
