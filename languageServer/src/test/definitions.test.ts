import { Position, Range } from 'vscode-languageserver/node'
import {
  foreach_dvc_yaml,
  params_dvc_yaml,
  vars_dvc_yaml
} from './fixtures/examples/valid'
import { params } from './fixtures/params'
import { requestDefinitions } from './utils/requestDefinitions'
import { openTheseFilesAndNotifyServer } from './utils/openTheseFilesAndNotifyServer'
import {
  disposeTestConnections,
  setupTestConnections
} from './utils/setup-test-connections'

describe('textDocument/definitions', () => {
  beforeEach(() => {
    setupTestConnections()
  })

  afterEach(() => {
    disposeTestConnections()
  })

  it('should not provide definitions for files other than dvc.yamls', async () => {
    const [paramsYaml] = await openTheseFilesAndNotifyServer([
      {
        languageId: 'yaml',
        mockContents: params,
        mockPath: 'params.yaml'
      }
    ])

    const response = await requestDefinitions(paramsYaml, 'auc')

    expect(response).toBeNull()
  })

  it('should be able to point out the symbol under the cursor when needed', async () => {
    const [dvcYaml] = await openTheseFilesAndNotifyServer([
      {
        languageId: 'yaml',
        mockContents: params_dvc_yaml,
        mockPath: 'dvc.yaml'
      },
      {
        languageId: 'yaml',
        mockContents: params,
        mockPath: 'params.yaml'
      }
    ])
    const response = await requestDefinitions(dvcYaml, 'auc')

    expect(response).toBeTruthy()
    expect(response).toStrictEqual({
      range: Range.create(Position.create(4, 0), Position.create(4, 3)),
      uri: 'file:///params.yaml'
    })
  })

  it('should be able to read a complicated command from a stage', async () => {
    const [dvcYaml] = await openTheseFilesAndNotifyServer([
      {
        languageId: 'yaml',
        mockContents: foreach_dvc_yaml,
        mockPath: 'dvc.yaml'
      }
    ])
    const response = await requestDefinitions(dvcYaml, '{item.os}')

    expect(response).toBeTruthy()
    expect(response).toStrictEqual({
      range: Range.create(Position.create(15, 8), Position.create(15, 10)),
      uri: 'file:///dvc.yaml'
    })
  })

  it('should provide a single location that points to the top of the file path symbol', async () => {
    const [dvcYaml] = await openTheseFilesAndNotifyServer([
      {
        languageId: 'yaml',
        mockContents: vars_dvc_yaml,
        mockPath: 'dvc.yaml'
      },
      {
        languageId: 'json',
        mockContents: '',
        mockPath: 'params.json'
      }
    ])
    const response = await requestDefinitions(dvcYaml, 'params.json')

    expect(response).toBeTruthy()
    expect(response).toStrictEqual({
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
      uri: 'file:///params.json'
    })
  })
})
