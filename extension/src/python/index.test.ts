import { join } from 'path'
import { setupVenv } from '.'
import { createProcessWithOutput } from '../processExecution'
import { getProcessPlatform } from '../env'

jest.mock('../processExecution')
jest.mock('../env')

const mockedCreateProcess = jest.mocked(createProcessWithOutput)
const mockedGetProcessPlatform = jest.mocked(getProcessPlatform)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('setupVenv', () => {
  it('should create the correct python processes on sane operating systems', async () => {
    mockedGetProcessPlatform.mockReturnValue('freebsd')

    const envDir = '.env'
    const cwd = __dirname

    await setupVenv(__dirname, envDir, 'dvc')

    expect(mockedCreateProcess).toBeCalledTimes(3)
    expect(mockedCreateProcess).toBeCalledWith({
      args: ['-m', 'venv', envDir],
      cwd,
      executable: 'python3'
    })

    expect(mockedCreateProcess).toBeCalledWith({
      args: ['-m', 'pip', 'install', '--upgrade', 'pip'],
      cwd,
      executable: join(cwd, envDir, 'bin', 'python')
    })

    expect(mockedCreateProcess).toBeCalledWith({
      args: ['-m', 'pip', 'install', '--upgrade', 'dvc'],
      cwd,
      executable: join(cwd, envDir, 'bin', 'python')
    })
  })

  it('should create the correct python processes on windows', async () => {
    mockedGetProcessPlatform.mockReturnValue('win32')

    const envDir = '.env'
    const cwd = __dirname

    await setupVenv(__dirname, envDir, '-r', 'requirements.txt')

    expect(mockedCreateProcess).toBeCalledTimes(3)
    expect(mockedCreateProcess).toBeCalledWith({
      args: ['-m', 'venv', envDir],
      cwd,
      executable: 'python'
    })

    expect(mockedCreateProcess).toBeCalledWith({
      args: ['-m', 'pip', 'install', '--upgrade', 'pip'],
      cwd,
      executable: join(cwd, envDir, 'Scripts', 'python.exe')
    })

    expect(mockedCreateProcess).toBeCalledWith({
      args: ['-m', 'pip', 'install', '--upgrade', '-r', 'requirements.txt'],
      cwd,
      executable: join(cwd, envDir, 'Scripts', 'python.exe')
    })
  })
})
