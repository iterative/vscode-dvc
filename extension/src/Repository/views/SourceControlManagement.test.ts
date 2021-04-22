import { scm, Uri } from 'vscode'
import { mocked } from 'ts-jest/utils'
import {
  SourceControlManagement,
  SourceControlManagementState
} from './SourceControlManagement'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')

const mockedScm = mocked(scm)
const mockedCreateSourceControl = jest.fn().mockReturnValue({
  inputBox: { visible: true },
  createResourceGroup: jest.fn().mockReturnValue({})
})
mockedScm.createSourceControl = mockedCreateSourceControl

beforeEach(() => {
  jest.clearAllMocks()
})

describe('SourceControlManagement', () => {
  describe('setState', () => {
    it('should be able to set the state', async () => {
      const initialState = {} as SourceControlManagementState
      const sourceControlManagement = new SourceControlManagement(
        __dirname,
        initialState
      )
      expect(mockedCreateSourceControl).toBeCalledTimes(1)
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
