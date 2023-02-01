import { join } from 'path'
import { Position, Range } from 'vscode-languageserver/node'
import { URI } from 'vscode-uri'
import {
  params_dvc_yaml,
  plots_dvc_yaml,
  train_dvc_yaml
} from './fixtures/examples/valid'
import { params } from './fixtures/params'
import { train } from './fixtures/python'
import { requestDefinitions } from './utils/requestDefinitions'
import { openTheseFilesAndNotifyServer } from './utils/openTheseFilesAndNotifyServer'
import {
  disposeTestConnections,
  setupTestConnections
} from './utils/setup-test-connections'

const mockedReadFileContents = jest.fn()

describe('textDocument/definitions', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    setupTestConnections(mockedReadFileContents)
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
    const response = await requestDefinitions(dvcYaml, '- params.yaml', 2)

    expect(response).toBeTruthy()
    expect(response).toStrictEqual({
      range: Range.create(Position.create(0, 0), Position.create(5, 9)),
      uri: 'file:///params.yaml'
    })
  })

  it('should try to read the file system when a python file is unknown', async () => {
    const trainUri = URI.file(join(__dirname, 'train.py')).toString()

    mockedReadFileContents.mockImplementation(path => {
      if (path === trainUri) {
        return { contents: train }
      }
      return null
    })

    const [dvcYaml] = await openTheseFilesAndNotifyServer([
      {
        languageId: 'yaml',
        mockContents: train_dvc_yaml,
        mockPath: join(__dirname, 'dvc.yaml')
      }
    ])

    const response = await requestDefinitions(dvcYaml, 'train.py')

    expect(mockedReadFileContents).toHaveBeenCalledWith(trainUri, {
      _isCancelled: false
    })

    expect(response).toBeTruthy()
    expect(response).toStrictEqual({
      range: Range.create(Position.create(0, 0), Position.create(7, 13)),
      uri: trainUri
    })
  })

  it('should return null if the provided symbol is not in the known documents and cannot be found on the file system', async () => {
    mockedReadFileContents.mockResolvedValue(null)

    const [dvcYaml] = await openTheseFilesAndNotifyServer([
      {
        languageId: 'yaml',
        mockContents: plots_dvc_yaml,
        mockPath: join(__dirname, 'dvc.yaml')
      }
    ])

    const response = await requestDefinitions(dvcYaml, 'plot5')

    expect(mockedReadFileContents).toHaveBeenCalledTimes(1)
    expect(response).toBeNull()
  })
})
