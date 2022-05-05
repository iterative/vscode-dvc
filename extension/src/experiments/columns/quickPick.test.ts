import { pickFromColumns } from './quickPick'
import { appendColumnToPath, joinColumnPath } from './paths'
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

describe('pickFromColumns', () => {
  const params = ColumnType.PARAMS
  const paramsYaml = 'params.yaml'
  const paramsYamlPath = joinColumnPath(params, paramsYaml)
  const epochsParamPath = appendColumnToPath(paramsYamlPath, 'epochs')
  const epochsParam = {
    hasChildren: false,
    maxNumber: 5,
    maxStringLength: 1,
    minNumber: 2,
    name: 'epochs',
    parentPath: paramsYamlPath,
    path: epochsParamPath,
    type: ColumnType.PARAMS,
    types: ['number']
  }

  const paramsYamlParam = {
    hasChildren: true,
    name: paramsYaml,
    parentPath: params,
    path: paramsYamlPath,
    type: ColumnType.PARAMS
  }
  const exampleColumns = [epochsParam, paramsYamlParam]

  it('should return early if no params or metrics are provided', async () => {
    const picked = await pickFromColumns([], {
      title: "can't pick from no params or metrics" as Title
    })
    expect(picked).toBeUndefined()
    expect(mockedShowError).toBeCalledTimes(1)
    expect(mockedQuickPickValue).not.toBeCalled()
  })

  it('should invoke a QuickPick with the correct options', async () => {
    const title = 'Test title' as Title
    await pickFromColumns(exampleColumns, { title })
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
