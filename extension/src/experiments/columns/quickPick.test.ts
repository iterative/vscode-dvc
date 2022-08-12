import { pickFromColumnLikes } from './quickPick'
import { appendColumnToPath, buildMetricOrParamPath } from './paths'
import { quickPickValue } from '../../vscode/quickPick'
import { Toast } from '../../vscode/toast'
import { Title } from '../../vscode/title'
import { ColumnType } from '../webview/contract'

jest.mock('../../vscode/quickPick')
jest.mock('../../vscode/toast')

const mockedQuickPickValue = jest.mocked(quickPickValue)
const mockedToast = jest.mocked(Toast)
const mockedShowError = jest.fn()
mockedToast.showError = mockedShowError

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickFromColumnLikes', () => {
  const params = ColumnType.PARAMS
  const paramsYaml = 'params.yaml'
  const paramsYamlPath = buildMetricOrParamPath(params, paramsYaml)
  const epochsParamPath = appendColumnToPath(paramsYamlPath, 'epochs')
  const epochsParam = {
    label: 'epochs',
    path: epochsParamPath,
    types: ['number']
  }

  const paramsYamlParam = {
    label: paramsYaml,
    path: paramsYamlPath
  }
  const exampleColumns = [epochsParam, paramsYamlParam]

  it('should return early if no columns are provided', async () => {
    const picked = await pickFromColumnLikes([], {
      title: "can't pick from no columns" as Title
    })
    expect(picked).toBeUndefined()
    expect(mockedShowError).toBeCalledTimes(1)
    expect(mockedQuickPickValue).not.toBeCalled()
  })

  it('should invoke a QuickPick with the correct options', async () => {
    const title = 'Test title' as Title
    await pickFromColumnLikes(exampleColumns, { title })
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
