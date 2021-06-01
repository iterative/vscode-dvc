import { scm, Uri } from 'vscode'
import { mocked } from 'ts-jest/utils'
import { Disposable, Disposer } from '@hediet/std/disposable'
import {
  SourceControlManagement,
  SourceControlManagementState
} from './sourceControlManagement'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')

const mockedScm = mocked(scm)
const mockedDisposable = mocked(Disposable)

beforeEach(() => {
  jest.resetAllMocks()
  mockedDisposable.fn.mockReturnValueOnce(({
    track: function<T>(disposable: T): T {
      return disposable
    }
  } as unknown) as (() => void) & Disposer)
})

describe('SourceControlManagement', () => {
  describe('setState', () => {
    it('should be able to set the state', () => {
      const mockedCreateSourceControl = jest.fn().mockReturnValueOnce({
        inputBox: { visible: true },
        createResourceGroup: jest.fn().mockReturnValueOnce({})
      })
      mockedScm.createSourceControl = mockedCreateSourceControl

      const initialState = {} as SourceControlManagementState
      const sourceControlManagement = new SourceControlManagement(
        __dirname,
        initialState
      )
      expect(mockedCreateSourceControl).toBeCalledTimes(1)
      expect(sourceControlManagement.getState()).toEqual([])

      const updatedState = ({
        added: new Set(['/some/new/path']),
        deleted: new Set(['/some/deleted/path', '/some/other/deleted/path']),
        dispose: () => undefined,
        tracked: new Set(['/some/excluded/tracked/path'])
      } as unknown) as SourceControlManagementState

      sourceControlManagement.setState(updatedState)

      expect(sourceControlManagement.getState()).toEqual([
        { resourceUri: Uri.file('/some/new/path'), contextValue: 'added' },
        {
          resourceUri: Uri.file('/some/deleted/path'),
          contextValue: 'deleted'
        },
        {
          resourceUri: Uri.file('/some/other/deleted/path'),
          contextValue: 'deleted'
        }
      ])

      sourceControlManagement.setState(initialState)
      expect(sourceControlManagement.getState()).toEqual([])
    })
  })
})
