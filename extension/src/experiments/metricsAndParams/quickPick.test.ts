import { pickFromMetricsAndParams } from './quickPick'
import { joinMetricOrParamPath } from './paths'
import { quickPickValue } from '../../vscode/quickPick'
import { reportError } from '../../vscode/toast'

jest.mock('../../vscode/quickPick')
jest.mock('../../vscode/toast')

const mockedQuickPickValue = jest.mocked(quickPickValue)
const mockedReportError = jest.mocked(reportError)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickFromMetricsAndParams', () => {
  const params = 'params'
  const paramsYaml = 'params.yaml'
  const paramsYamlPath = joinMetricOrParamPath(params, paramsYaml)
  const epochsParamPath = joinMetricOrParamPath(paramsYamlPath, 'epochs')
  const epochsParam = {
    group: params,
    hasChildren: false,
    maxNumber: 5,
    maxStringLength: 1,
    minNumber: 2,
    name: 'epochs',
    parentPath: paramsYamlPath,
    path: epochsParamPath,
    types: ['number']
  }

  const paramsYamlParam = {
    group: params,
    hasChildren: true,
    name: paramsYaml,
    parentPath: params,
    path: paramsYamlPath
  }
  const exampleMetricsAndParams = [epochsParam, paramsYamlParam]

  it('should return early if no params or metrics are provided', async () => {
    const picked = await pickFromMetricsAndParams([], {
      title: "can't pick from no params or metrics"
    })
    expect(picked).toBeUndefined()
    expect(mockedReportError).toBeCalledTimes(1)
    expect(mockedQuickPickValue).not.toBeCalled()
  })

  it('should invoke a QuickPick with the correct options', async () => {
    const title = 'Test title'
    await pickFromMetricsAndParams(exampleMetricsAndParams, { title })
    expect(mockedQuickPickValue).toBeCalledWith(
      [
        {
          description: epochsParamPath,
          label: 'epochs',
          value: epochsParam
        },
        {
          description: paramsYamlPath,
          label: paramsYaml,
          value: paramsYamlParam
        }
      ],
      { title }
    )
  })
})
