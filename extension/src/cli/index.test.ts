import { mocked } from 'ts-jest/utils'
import { execPromise } from '../util'
import { basename, join, resolve } from 'path'
import { add, getStatus } from '.'
import { mapPaths } from '../util/testHelpers'

jest.mock('fs')
jest.mock('../util')
jest.mock('vscode')

const mockedExecPromise = mocked(execPromise)

beforeEach(() => {
  jest.resetAllMocks()
})

// const getTestUri = (path: string): Uri => Uri.file(resolve(__dirname, path))

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
    const statusOutput = {
      train: [
        { 'changed deps': { 'data/MNIST': 'modified' } },
        { 'changed outs': { 'model.pt': 'modified', logs: 'modified' } },
        'always changed'
      ],
      'data/MNIST/raw.dvc': [
        { 'changed outs': { 'data/MNIST/raw': 'modified' } }
      ]
    }
    const stdout = JSON.stringify(statusOutput)
    const dvcRoot = resolve(__dirname, '..', '..', '..', 'demo')
    mockedExecPromise.mockResolvedValueOnce({
      stdout: stdout,
      stderr: ''
    })

    const status = await getStatus({
      dvcRoot,
      cliPath: 'dvc'
    })

    expect(Object.keys(status)).toEqual(['modified'])
    expect(mapPaths(status.modified)).toEqual([join(dvcRoot, 'data/MNIST/raw')])
    expect(mockedExecPromise).toBeCalledWith('dvc status', {
      cwd: dvcRoot
    })
  })

  it('should return an object containing modified and deleted paths', async () => {
    const statusOutput = {
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
    const stdout = JSON.stringify(statusOutput)
    const dvcRoot = __dirname
    mockedExecPromise.mockResolvedValueOnce({
      stdout: stdout,
      stderr: ''
    })

    const status = await getStatus({
      dvcRoot,
      cliPath: 'dvc'
    })

    expect(Object.keys(status).sort()).toEqual(['deleted', 'modified'])
    expect(mapPaths(status.deleted)).toEqual([join(dvcRoot, 'bar')])
    expect(mapPaths(status.modified)).toEqual([
      join(dvcRoot, 'baz'),
      join(dvcRoot, 'foo')
    ])
    expect(mockedExecPromise).toBeCalledWith('dvc status', {
      cwd: dvcRoot
    })
  })

  it('should return an object with an entry for each path', async () => {
    const statusOutput = {
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
    const stdout = JSON.stringify(statusOutput)
    const dvcRoot = __dirname
    mockedExecPromise.mockResolvedValueOnce({
      stdout: stdout,
      stderr: ''
    })

    const status = await getStatus({
      dvcRoot,
      cliPath: 'dvc'
    })

    expect(Object.keys(status).sort()).toEqual([
      'deleted',
      'modified',
      'not in cache'
    ])
    expect(mapPaths(status.modified)).toEqual([join(dvcRoot, 'data/features')])
    expect(mapPaths(status['not in cache'])).toEqual([
      join(dvcRoot, 'data/data.xml'),
      join(dvcRoot, 'data/prepared')
    ])
    expect(mapPaths(status.deleted)).toEqual([join(dvcRoot, 'model.pkl')])
    expect(mockedExecPromise).toBeCalledWith('dvc status', {
      cwd: dvcRoot
    })
  })
})
