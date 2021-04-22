import {
  SourceControlManagement,
  SourceControlManagementState
} from './SourceControlManagement'
import { scm, Uri } from 'vscode'
import { mocked } from 'ts-jest/utils'

jest.mock('vscode')

const mockedScm = mocked(scm)
mockedScm.createSourceControl = jest.fn().mockReturnValue({
  inputBox: { visible: true },
  createResourceGroup: jest.fn().mockReturnValue({})
})

describe('SourceControlManagement', () => {
  it('should be able to be instantiated', () => {
    const sourceControlManagement = new SourceControlManagement(
      __dirname,
      {} as SourceControlManagementState
    )
    expect(sourceControlManagement).toBeDefined()
  })

  describe('setState', () => {
    it('should be able to set the state', async () => {
      const initialState = {} as SourceControlManagementState
      const sourceControlManagement = new SourceControlManagement(
        __dirname,
        initialState
      )
      expect(sourceControlManagement.getState()).toEqual([])

      const updatedState = ({
        deleted: new Set(['/some/deleted/path', '/some/other/deleted/path']),
        dispose: () => undefined
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
        }
      ])
    })
  })
})
