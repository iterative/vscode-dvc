import { mocked } from 'ts-jest/utils'
import { execPromise } from '../util'
import { basename, resolve } from 'path'
import { addTarget } from '.'

jest.mock('fs')
jest.mock('../util')
jest.mock('vscode')

const mockedExecPromise = mocked(execPromise)

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

    mockedExecPromise.mockResolvedValueOnce({
      stdout,
      stderr: ''
    })

    const output = await addTarget({
      cliPath: 'dvc',
      fsPath
    })
    expect(output).toEqual(stdout)

    expect(mockedExecPromise).toBeCalledWith(`dvc add ${file}`, {
      cwd: dir
    })
  })
})
