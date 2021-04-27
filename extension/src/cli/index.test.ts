import { addTarget } from '.'
import { mocked } from 'ts-jest/utils'
import { runProcess } from '../processExecution'
import { basename, resolve } from 'path'

jest.mock('fs-extra')
jest.mock('../processExecution')
jest.mock('vscode')

const mockedRunProcess = mocked(runProcess)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('add', () => {
  it('should call execPromise with the correct parameters', async () => {
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

    expect(mockedRunProcess).toBeCalledWith(
      expect.objectContaining({
        executable: 'dvc',
        args: ['add', file],
        cwd: dir
      })
    )
  })
})
