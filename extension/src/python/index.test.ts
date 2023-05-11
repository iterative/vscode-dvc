import { join } from 'path'
import { setupTestVenv } from '.'
import { Process, createProcess } from '../process/execution'
import { getProcessPlatform } from '../env'

jest.mock('../env')
jest.mock('../process/execution')
jest.mock('../util/esm')

const mockedGetProcessPlatform = jest.mocked(getProcessPlatform)
const mockedCreateProcess = jest.mocked(createProcess)
const mockedProcess = {
  all: { on: jest.fn() }
} as unknown as Process

beforeEach(() => {
  jest.resetAllMocks()
})

describe('setupTestVenv', () => {
  it('should create the correct python processes on sane operating systems', async () => {
    mockedCreateProcess.mockResolvedValue(mockedProcess)
    mockedGetProcessPlatform.mockReturnValue('freebsd')

    const envDir = '.env'
    const cwd = __dirname

    await setupTestVenv(__dirname, envDir, 'dvc')

    expect(mockedCreateProcess).toHaveBeenCalledTimes(3)
    expect(mockedCreateProcess).toHaveBeenCalledWith({
      args: ['-m', 'venv', envDir],
      cwd,
      executable: 'python3'
    })

    expect(mockedCreateProcess).toHaveBeenCalledWith({
      args: ['-m', 'pip', 'install', '--upgrade', 'pip', 'wheel'],
      cwd,
      executable: join(cwd, envDir, 'bin', 'python')
    })

    expect(mockedCreateProcess).toHaveBeenCalledWith({
      args: ['-m', 'pip', 'install', '--upgrade', 'dvc'],
      cwd,
      executable: join(cwd, envDir, 'bin', 'python')
    })
  })

  it('should create the correct python processes on windows', async () => {
    mockedGetProcessPlatform.mockReturnValue('win32')
    mockedCreateProcess.mockResolvedValue(mockedProcess)

    const envDir = '.env'
    const cwd = __dirname

    await setupTestVenv(__dirname, envDir, '-r', 'requirements.txt')

    expect(mockedCreateProcess).toHaveBeenCalledTimes(3)
    expect(mockedCreateProcess).toHaveBeenCalledWith({
      args: ['-m', 'venv', envDir],
      cwd,
      executable: 'python'
    })

    expect(mockedCreateProcess).toHaveBeenCalledWith({
      args: ['-m', 'pip', 'install', '--upgrade', 'pip', 'wheel'],
      cwd,
      executable: join(cwd, envDir, 'Scripts', 'python.exe')
    })

    expect(mockedCreateProcess).toHaveBeenCalledWith({
      args: ['-m', 'pip', 'install', '--upgrade', '-r', 'requirements.txt'],
      cwd,
      executable: join(cwd, envDir, 'Scripts', 'python.exe')
    })
  })
})
