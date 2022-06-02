import { scm, Uri } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import {
  SourceControlManagement,
  SourceControlManagementState
} from './sourceControlManagement'
import { isDirectory } from '../fileSystem'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('../fileSystem')

const mockedScm = jest.mocked(scm)
const mockedDisposable = jest.mocked(Disposable)
const mockedIsDirectory = jest.mocked(isDirectory)

beforeEach(() => {
  jest.resetAllMocks()
  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)
})

describe('SourceControlManagement', () => {
  describe('setState', () => {
    it('should be able to set the state', () => {
      mockedIsDirectory.mockReturnValue(false)
      const dvcRoot = __dirname
      const mockedCreateSourceControl = jest.fn().mockReturnValueOnce({
        createResourceGroup: jest
          .fn()
          .mockReturnValueOnce({})
          .mockReturnValueOnce({})
          .mockReturnValueOnce({}),
        inputBox: { visible: true }
      })
      mockedScm.createSourceControl = mockedCreateSourceControl

      const initialState = {} as SourceControlManagementState
      const sourceControlManagement = new SourceControlManagement(
        dvcRoot,
        initialState
      )
      expect(mockedCreateSourceControl).toBeCalledTimes(1)
      expect(sourceControlManagement.getState()).toStrictEqual({
        changes: [],
        gitCommitReady: [],
        notInCache: []
      })

      const updatedState = {
        added: new Set(['/some/new/path']),
        deleted: new Set(['/some/deleted/path', '/some/other/deleted/path']),
        dispose: () => undefined,
        hasRemote: new Set([
          '/some/new/path',
          '/some/deleted/path',
          '/some/other/deleted/path',
          '/some/excluded/tracked/path',
          '/some/missing/path',
          '/some/other/missing/path'
        ]),
        notInCache: new Set(['/some/missing/path', '/some/other/missing/path']),
        tracked: new Set(['/some/excluded/tracked/path'])
      } as unknown as SourceControlManagementState

      sourceControlManagement.setState(updatedState)

      expect(sourceControlManagement.getState()).toStrictEqual({
        changes: [
          {
            contextValue: 'deleted',
            dvcRoot,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file('/some/deleted/path')
          },
          {
            contextValue: 'deleted',
            dvcRoot,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file('/some/other/deleted/path')
          }
        ],
        gitCommitReady: [
          {
            contextValue: 'added',
            dvcRoot,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file('/some/new/path')
          }
        ],
        notInCache: [
          {
            contextValue: 'notInCache',
            dvcRoot,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file('/some/missing/path')
          },
          {
            contextValue: 'notInCache',
            dvcRoot,
            isDirectory: false,
            isTracked: true,
            resourceUri: Uri.file('/some/other/missing/path')
          }
        ]
      })

      sourceControlManagement.setState(initialState)
      expect(sourceControlManagement.getState()).toStrictEqual({
        changes: [],
        gitCommitReady: [],
        notInCache: []
      })
    })
  })
})
