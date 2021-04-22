import {
  SourceControlManagement,
  SourceControlManagementState
} from './SourceControlManagement'
import { scm } from 'vscode'
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
})
