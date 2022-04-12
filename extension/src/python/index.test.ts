import { join } from 'path'
import { setupVenv } from '.'
import * as ProcessExecution from '../processExecution'
import { getProcessPlatform } from '../env'

jest.mock('../env')

const mockedGetProcessPlatform = jest.mocked(getProcessPlatform)
const createProcessSpy = jest.spyOn(ProcessExecution, 'createProcess')
const mockedProcess = {
  all: { on: jest.fn() }
} as unknown as ProcessExecution.Process

beforeEach(() => {
  jest.resetAllMocks()
})

describe('setupVenv', () => {
  it('should create the correct python processes on sane operating systems', async () => {
    createProcessSpy.mockResolvedValue(mockedProcess)
    mockedGetProcessPlatform.mockReturnValue('freebsd')

    const envDir = '.env'
    const cwd = __dirname

    await setupVenv(__dirname, envDir, 'dvc')

    expect(createProcessSpy).toBeCalledTimes(3)
    expect(createProcessSpy).toBeCalledWith({
      args: ['-m', 'venv', envDir],
      cwd,
      executable: 'python3'
    })

    expect(createProcessSpy).toBeCalledWith({
      args: ['-m', 'pip', 'install', '--upgrade', 'pip', 'wheel'],
      cwd,
      executable: join(cwd, envDir, 'bin', 'python')
    })

    expect(createProcessSpy).toBeCalledWith({
      args: ['-m', 'pip', 'install', '--upgrade', 'dvc'],
      cwd,
      executable: join(cwd, envDir, 'bin', 'python')
    })
  })

  it('should create the correct python processes on windows', async () => {
    mockedGetProcessPlatform.mockReturnValue('win32')
    createProcessSpy.mockResolvedValue(mockedProcess)

    const envDir = '.env'
    const cwd = __dirname

    await setupVenv(__dirname, envDir, '-r', 'requirements.txt')

    expect(createProcessSpy).toBeCalledTimes(3)
    expect(createProcessSpy).toBeCalledWith({
      args: ['-m', 'venv', envDir],
      cwd,
      executable: 'python'
    })

    expect(createProcessSpy).toBeCalledWith({
      args: ['-m', 'pip', 'install', '--upgrade', 'pip', 'wheel'],
      cwd,
      executable: join(cwd, envDir, 'Scripts', 'python.exe')
    })

    expect(createProcessSpy).toBeCalledWith({
      args: ['-m', 'pip', 'install', '--upgrade', '-r', 'requirements.txt'],
      cwd,
      executable: join(cwd, envDir, 'Scripts', 'python.exe')
    })
  })
})
