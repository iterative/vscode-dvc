import { join, resolve } from 'path'
import { Config } from './Config'
import { mocked } from 'ts-jest/utils'
import { DecorationProvider } from './DecorationProvider'
import { Repository } from './Repository'
import { window } from 'vscode'
import { listDvcOnlyRecursive, status } from './cli/reader'
import { getAllUntracked } from './git'

jest.mock('./Config')
jest.mock('./cli/reader')
jest.mock('./git')

const mockedWindow = mocked(window)
mockedWindow.registerFileDecorationProvider = jest.fn()

const mockListDvcOnlyRecursive = mocked(listDvcOnlyRecursive)
const mockedStatus = mocked(status)

const mockedAllUntracked = mocked(getAllUntracked)

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

  describe('updateState', () => {
    it('should update the repository state', async () => {
      const logFolder = 'logs'
      const logAcc = join(logFolder, 'acc.tsv')
      const logLoss = join(logFolder, 'loss.tsv')
      const model = 'model.pt'
      mockListDvcOnlyRecursive.mockResolvedValueOnce([logAcc, logLoss, model])

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

      const untracked = new Set([
        resolve(dvcRoot, 'some', 'untracked', 'python.py')
      ])
      mockedAllUntracked.mockResolvedValueOnce(untracked)
      await repository.updateState()

      expect(mockedStatus).toBeCalledWith({ cwd: dvcRoot, cliPath: undefined })

      expect(repository.getState()).toEqual({
        deleted: new Set(),
        notInCache: new Set(),
        new: new Set(),
        modified: new Set([join(dvcRoot, 'data/MNIST/raw')]),
        tracked: new Set([
          resolve(dvcRoot, logAcc),
          resolve(dvcRoot, logLoss),
          resolve(dvcRoot, model),
          resolve(dvcRoot, logFolder)
        ]),
        untracked
      })
    })
  })

  //   describe('updateTracked', () => {
  //     it("should update the repository's tracked paths", async () => {
  //       const logFolder = 'logs'
  //       const logAcc = join(logFolder, 'acc.tsv')
  //       const logLoss = join(logFolder, 'loss.tsv')
  //       const model = 'model.pt'
  //       mockListDvcOnlyRecursive.mockResolvedValueOnce([logAcc, logLoss, model])
  //       await repository.updateTracked()

  //       expect(repository.getState()).toEqual({
  //         tracked: new Set([
  //           resolve(dvcRoot, logAcc),
  //           resolve(dvcRoot, logLoss),
  //           resolve(dvcRoot, logFolder),
  //           resolve(dvcRoot, model)
  //         ])
  //       })
  //     })
  //   })

  //   describe('updateStatus', () => {
  //     const dvcRoot = resolve(__dirname, '..', '..', 'demo')

  //     it('should return an object containing modified paths', async () => {
  //       const statusOutput = {
  //         train: [
  //           { 'changed deps': { 'data/MNIST': 'modified' } },
  //           { 'changed outs': { 'model.pt': 'modified', logs: 'modified' } },
  //           'always changed'
  //         ],
  //         'data/MNIST/raw.dvc': [
  //           { 'changed outs': { 'data/MNIST/raw': 'modified' } }
  //         ]
  //       } as Record<string, (Record<string, Record<string, string>> | string)[]>
  //       mockedStatus.mockResolvedValueOnce(statusOutput)

  //       await repository.updateStatus()

  //       expect(repository.getState()).toEqual({
  //         deleted: new Set(),
  //         notInCache: new Set(),
  //         new: new Set(),
  //         modified: new Set([join(dvcRoot, 'data/MNIST/raw')])
  //       })
  //       expect(mockedStatus).toBeCalledWith({ cwd: dvcRoot, cliPath: undefined })
  //     })

  //     it('should return an object containing modified and deleted paths', async () => {
  //       const statusOutput = {
  //         'baz.dvc': [{ 'changed outs': { baz: 'modified' } }],
  //         dofoo: [
  //           { 'changed deps': { baz: 'modified' } },
  //           { 'changed outs': { foo: 'modified' } }
  //         ],
  //         dobar: [
  //           { 'changed deps': { foo: 'modified' } },
  //           { 'changed outs': { bar: 'deleted' } }
  //         ]
  //       } as Record<string, (Record<string, Record<string, string>> | string)[]>
  //       mockedStatus.mockResolvedValueOnce(statusOutput)

  //       await repository.updateStatus()

  //       expect(repository.getState()).toEqual({
  //         new: new Set(),
  //         notInCache: new Set(),
  //         deleted: new Set([join(dvcRoot, 'bar')]),
  //         modified: new Set([join(dvcRoot, 'baz'), join(dvcRoot, 'foo')])
  //       })
  //       expect(mockedStatus).toBeCalledWith({
  //         cwd: dvcRoot,
  //         cliPath: undefined
  //       })
  //     })

  //     it('should return an object with an entry for each path', async () => {
  //       const statusOutput = {
  //         prepare: [
  //           { 'changed deps': { 'data/data.xml': 'not in cache' } },
  //           { 'changed outs': { 'data/prepared': 'not in cache' } }
  //         ],
  //         featurize: [
  //           { 'changed deps': { 'data/prepared': 'not in cache' } },
  //           { 'changed outs': { 'data/features': 'modified' } }
  //         ],
  //         train: [
  //           { 'changed deps': { 'data/features': 'modified' } },
  //           { 'changed outs': { 'model.pkl': 'deleted' } }
  //         ],
  //         evaluate: [
  //           {
  //             'changed deps': {
  //               'data/features': 'modified',
  //               'model.pkl': 'deleted'
  //             }
  //           }
  //         ],
  //         'data/data.xml.dvc': [
  //           { 'changed outs': { 'data/data.xml': 'not in cache' } }
  //         ]
  //       } as Record<string, (Record<string, Record<string, string>> | string)[]>
  //       mockedStatus.mockResolvedValueOnce(statusOutput)

  //       await repository.updateStatus()

  //       expect(repository.getState()).toEqual({
  //         new: new Set(),
  //         modified: new Set([join(dvcRoot, 'data/features')]),
  //         notInCache: new Set([
  //           join(dvcRoot, 'data/data.xml'),
  //           join(dvcRoot, 'data/prepared')
  //         ]),
  //         deleted: new Set([join(dvcRoot, 'model.pkl')])
  //       })
  //       expect(mockedStatus).toBeCalledWith({
  //         cwd: dvcRoot,
  //         cliPath: undefined
  //       })
  //     })
  //   })
})
