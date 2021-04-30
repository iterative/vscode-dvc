import { scm, Uri } from 'vscode'
import { mocked } from 'ts-jest/utils'
import {
  SourceControlManagement,
  SourceControlManagementState
} from './SourceControlManagement'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')

const mockedScm = mocked(scm)

beforeEach(() => {
  jest.clearAllMocks()
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
        deleted: new Set(['/some/deleted/path', '/some/other/deleted/path']),
        dispose: () => undefined,
        new: new Set(['/some/new/path']),
        tracked: new Set(['/some/excluded/tracked/path'])
      } as unknown) as SourceControlManagementState

      sourceControlManagement.setState(updatedState)

      expect(sourceControlManagement.getState()).toEqual([
        {
          resourceUri: Uri.file('/some/deleted/path'),
          contextValue: 'deleted'
        },
        {
          resourceUri: Uri.file('/some/other/deleted/path'),
          contextValue: 'deleted'
        },
        { resourceUri: Uri.file('/some/new/path'), contextValue: 'new' }
      ])

      sourceControlManagement.setState(initialState)
      expect(sourceControlManagement.getState()).toEqual([])
    })
  })
})
