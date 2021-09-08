import { mocked } from 'ts-jest/utils'
import { QuickPickOptions, window } from 'vscode'
import { pickFromParamsAndMetrics } from './quickPick'
import { joinParamOrMetricPath } from './paths'
import { QuickPickItemWithValue } from '../../vscode/quickPick'

const mockedShowQuickPick = mocked<
  (
    items: QuickPickItemWithValue[],
    options: QuickPickOptions
  ) => Thenable<
    | QuickPickItemWithValue[]
    | QuickPickItemWithValue
    | string
    | undefined
    | unknown
  >
>(window.showQuickPick)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickFromParamsAndMetrics', () => {
  const params = 'params'
  const paramsYaml = 'params.yaml'
  const paramsYamlPath = joinParamOrMetricPath(params, paramsYaml)
  const epochsParamPath = joinParamOrMetricPath(paramsYamlPath, 'epochs')
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
  const exampleParamsAndMetrics = [epochsParam, paramsYamlParam]

  it('should return early if no params or metrics are provided', async () => {
    const picked = await pickFromParamsAndMetrics([], {
      title: "can't pick from no params or metrics"
    })
    expect(picked).toBeUndefined()
  })

  it('should invoke a QuickPick with the correct options', async () => {
    const title = 'Test title'
    await pickFromParamsAndMetrics(exampleParamsAndMetrics, { title })
    expect(mockedShowQuickPick).toBeCalledWith(
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
