import { join, resolve } from 'path'
import { Config } from './Config'
import { mocked } from 'ts-jest/utils'
import { DecorationProvider } from './DecorationProvider'
import { Repository } from './Repository'
import { window } from 'vscode'
import { listDvcOnlyRecursive, status } from './cli/reader'
import { mapPaths } from './util/testHelpers'

jest.mock('./Config')
jest.mock('./cli/reader')

const mockedWindow = mocked(window)
mockedWindow.registerFileDecorationProvider = jest.fn()

const mockListDvcOnlyRecursive = mocked(listDvcOnlyRecursive)
const mockedStatus = mocked(status)

const dvcRoot = resolve(__dirname, '..', '..', 'demo')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('Repository', () => {
  mockListDvcOnlyRecursive.mockResolvedValueOnce([])
  mockedStatus.mockResolvedValue({})
  const config = new Config()
  const decorationProvider = new DecorationProvider()
  const repository = new Repository(dvcRoot, config, decorationProvider)
  it('should be able to be instantiated', async () => {
    expect(repository.ready).toBeDefined()
  })

  describe('updateTracked', () => {
    it("should update the repository's tracked paths", async () => {
      const logFolder = 'logs'
      const logAcc = join(logFolder, 'acc.tsv')
      const logLoss = join(logFolder, 'loss.tsv')
      const model = 'model.pt'
      mockListDvcOnlyRecursive.mockResolvedValueOnce([logAcc, logLoss, model])
      await repository.updateTracked()

      expect(repository.tracked).toEqual(
        new Set([
          resolve(dvcRoot, logAcc),
          resolve(dvcRoot, logLoss),
          resolve(dvcRoot, logFolder),
          resolve(dvcRoot, model)
        ])
      )
    })
  })

  describe('updateStatus', () => {
    const dvcRoot = resolve(__dirname, '..', '..', 'demo')

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
      } as Record<string, (Record<string, Record<string, string>> | string)[]>
      mockedStatus.mockResolvedValueOnce(statusOutput)

      await repository.updateStatus()

      expect(repository.deleted).toEqual([])
      expect(repository.notInCache).toEqual([])
      expect(repository.new).toEqual([])
      expect(mapPaths(repository.modified)).toEqual([
        join(dvcRoot, 'data/MNIST/raw')
      ])
      expect(mockedStatus).toBeCalledWith({ cwd: dvcRoot, cliPath: undefined })
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
      } as Record<string, (Record<string, Record<string, string>> | string)[]>
      mockedStatus.mockResolvedValueOnce(statusOutput)

      await repository.updateStatus()

      expect(repository.new).toEqual([])
      expect(repository.notInCache).toEqual([])
      expect(mapPaths(repository.deleted)).toEqual([join(dvcRoot, 'bar')])
      expect(mapPaths(repository.modified)).toEqual([
        join(dvcRoot, 'baz'),
        join(dvcRoot, 'foo')
      ])
      expect(mockedStatus).toBeCalledWith({
        cwd: dvcRoot,
        cliPath: undefined
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
      } as Record<string, (Record<string, Record<string, string>> | string)[]>
      mockedStatus.mockResolvedValueOnce(statusOutput)

      await repository.updateStatus()

      expect(repository.new).toEqual([])
      expect(mapPaths(repository.modified)).toEqual([
        join(dvcRoot, 'data/features')
      ])
      expect(mapPaths(repository.notInCache)).toEqual([
        join(dvcRoot, 'data/data.xml'),
        join(dvcRoot, 'data/prepared')
      ])
      expect(mapPaths(repository.deleted)).toEqual([join(dvcRoot, 'model.pkl')])
      expect(mockedStatus).toBeCalledWith({
        cwd: dvcRoot,
        cliPath: undefined
      })
    })
  })
})
