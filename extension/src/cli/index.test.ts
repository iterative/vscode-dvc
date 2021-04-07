import { mocked } from 'ts-jest/utils'
import { execPromise } from '../util'
import { basename, resolve } from 'path'
import { add, getStatus } from '.'

jest.mock('fs')
jest.mock('../util')

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

    const output = await add({
      cliPath: 'dvc',
      fsPath
    })
    expect(output).toEqual(stdout)

    expect(mockedExecPromise).toBeCalledWith(`dvc add ${file}`, {
      cwd: dir
    })
  })
})

describe('getStatus', () => {
  it('should run a object from the dvc output', async () => {
    const status = {
      train: [
        { 'changed deps': { 'data/MNIST': 'modified' } },
        { 'changed outs': { 'model.pt': 'modified', logs: 'modified' } },
        'always changed'
      ],
      'data/MNIST/raw.dvc': [
        { 'changed outs': { 'data/MNIST/raw': 'modified' } }
      ]
    }
    const stdout = JSON.stringify(status)
    const cwd = resolve()
    mockedExecPromise.mockResolvedValueOnce({
      stdout: stdout,
      stderr: ''
    })

    expect(
      await getStatus({
        cwd,
        cliPath: 'dvc'
      })
    ).toEqual(status)
    expect(mockedExecPromise).toBeCalledWith('dvc status', {
      cwd
    })
  })
})
