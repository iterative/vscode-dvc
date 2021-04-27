import { addTarget } from '.'
import { mocked } from 'ts-jest/utils'
import { runProcess } from '../processExecution'
import { basename, resolve } from 'path'
import { getProcessEnv } from '../env'

jest.mock('fs-extra')
jest.mock('../processExecution')
jest.mock('../env')
jest.mock('vscode')

const mockedRunProcess = mocked(runProcess)
const mockedGetProcessEnv = mocked(getProcessEnv)
const mockedEnv = {
  PATH: '/all/of/the/goodies:/in/my/path'
}

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValueOnce(mockedEnv)
})

describe('add', () => {
  it('should call runProcess with the correct parameters', async () => {
    const fsPath = __filename
    const dir = resolve(fsPath, '..')
    const file = basename(__filename)
    const stdout =
      `100% Add|████████████████████████████████████████████████` +
      `█████████████████████████████████████████████████████████` +
      `█████████████████████████████████████████████████████████` +
      `██████████████████████████████████████████|1/1 [00:00,  2` +
      `.20file/s]\n\r\n\rTo track the changes with git, run:\n\r` +
      `\n\rgit add ${file} .gitignore`

    mockedRunProcess.mockResolvedValueOnce(stdout)

    const output = await addTarget({
      cliPath: 'dvc',
      fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedRunProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['add', file],
      cwd: dir,
      env: mockedEnv
    })
  })
})
