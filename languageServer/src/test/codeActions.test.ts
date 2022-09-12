import { openTheseFilesAndNotifyServer } from './utils/openTheseFilesAndNotifyServer'
import {
  disposeTestConnections,
  setupTestConnections
} from './utils/setup-test-connections'
import { params_dvc_yaml } from './fixtures/examples/valid'
import { requestCodeActions } from './utils/requestCodeActions'

describe('textDocument/codeAction', () => {
  beforeEach(() => {
    setupTestConnections()
  })

  afterEach(() => {
    disposeTestConnections()
  })

  it('should present a refactoring option to add cmd files as stage dependencies', async () => {
    const [dvcYaml] = await openTheseFilesAndNotifyServer([
      {
        languageId: 'yaml',
        mockContents: params_dvc_yaml,
        mockPath: 'dvc.yaml'
      }
    ])
    const response = await requestCodeActions(dvcYaml)

    expect(response).toBeTruthy()
    expect(response?.[0].title).toBe('Add cmd files as dependencies')
  })
})
