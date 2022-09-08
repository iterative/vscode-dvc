import { openTheseFilesAndNotifyServer } from './utils/openTheseFilesAndNotifyServer'
import {
  disposeTestConnections,
  setupTestConnections
} from './utils/setup-test-connections'
import { requestCompletions } from './utils/requestCompletionsv1'

describe('textDocument/completions', () => {
  beforeEach(() => {
    setupTestConnections()
  })

  afterEach(() => {
    disposeTestConnections()
  })

  it('should present a snippet to add the stages map and populate it with one stage', async () => {
    const [dvcYaml] = await openTheseFilesAndNotifyServer([
      {
        languageId: 'yaml',
        mockContents: '',
        mockPath: 'dvc.yaml'
      }
    ])
    const response = await requestCompletions(dvcYaml)

    expect(response).toBeTruthy()
    expect(response).toStrictEqual([
      {
        insertText: 'stages:\n  $1:\n    cmd: $2\n',
        insertTextFormat: 2,
        label: 'stages'
      },
      {
        insertText: '$1:\n  cmd: $2\n',
        insertTextFormat: 2,
        label: 'Add stage'
      }
    ])
  })
  it('should not present the stages completion if the file is not a dvc.yaml', async () => {
    const [dvcYaml] = await openTheseFilesAndNotifyServer([
      {
        languageId: 'yaml',
        mockContents: '',
        mockPath: 'params.yaml'
      }
    ])
    const response = await requestCompletions(dvcYaml)

    expect(response).toBeTruthy()
    expect(response).toStrictEqual([])
  })
})
