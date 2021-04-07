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
  it('should return an object containing modified paths', async () => {
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
    ).toEqual({ 'data/MNIST/raw': 'modified' })
    expect(mockedExecPromise).toBeCalledWith('dvc status', {
      cwd
    })
  })

  it('should return an object containing modified and deleted paths', async () => {
    const status = {
      'baz.dvc': [{ 'changed outs': { baz: 'modified' } }],
      dofoo: [
        { 'changed deps': { baz: 'modified' } },
        { 'changed outs': { foo: 'modified' } }
      ],
      dobar: [
        { 'changed deps': { foo: 'modified' } },
        { 'changed outs': { bar: 'deleted' } }
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
    ).toEqual({ bar: 'deleted', baz: 'modified', foo: 'modified' })
    expect(mockedExecPromise).toBeCalledWith('dvc status', {
      cwd
    })
  })

  it('should return an object with an entry for each path', async () => {
    const status = {
      prepare: [
        { 'changed deps': { 'data/data.xml': 'not in cache' } },
        { 'changed outs': { 'data/prepared': 'not in cache' } }
      ],
      featurize: [
        { 'changed deps': { 'data/prepared': 'not in cache' } },
        { 'changed outs': { 'data/features': 'modified' } }
      ],
      train: [
        { 'changed deps': { 'data/features': 'modified' } },
        { 'changed outs': { 'model.pkl': 'deleted' } }
      ],
      evaluate: [
        {
          'changed deps': {
            'data/features': 'modified',
            'model.pkl': 'deleted'
          }
        }
      ],
      'data/data.xml.dvc': [
        { 'changed outs': { 'data/data.xml': 'not in cache' } }
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
    ).toEqual({
      'data/data.xml': 'not in cache',
      'data/features': 'modified',
      'data/prepared': 'not in cache',
      'model.pkl': 'deleted'
    })
    expect(mockedExecPromise).toBeCalledWith('dvc status', {
      cwd
    })
  })
})
