import { mocked } from 'ts-jest/utils'
import { window } from 'vscode'
import { getConfigValue, setUserConfigValue } from './config'
import { askUserToAssociateYaml } from './languageAssociation'

const mockedShowInformationMessage = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.showInformationMessage = mockedShowInformationMessage

const mockedSetUserConfigValue = mocked(setUserConfigValue)
const mockedGetConfigValue = mocked(getConfigValue)

jest.mock('vscode')
jest.mock('./config')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('askUserToAssociateYaml', () => {
  it('should set a user config option if the user responds with do not show again', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce("Don't Show Again")
    await askUserToAssociateYaml()

    expect(mockedSetUserConfigValue).toBeCalledTimes(1)
    expect(mockedSetUserConfigValue).toBeCalledWith(
      'dvc.doNotAssociateYaml',
      true
    )
  })

  it('should associate the file types with yaml if the user confirms', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce('Yes')
    mockedGetConfigValue.mockReturnValueOnce({
      '*.wat': 'perl'
    })
    await askUserToAssociateYaml()

    expect(mockedSetUserConfigValue).toBeCalledTimes(1)
    expect(mockedSetUserConfigValue).toBeCalledWith('files.associations', {
      '*.dvc': 'yaml',
      '*.wat': 'perl',
      'dvc.lock': 'yaml'
    })
  })

  it('should not set any options if the user responds with no', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce('No')
    await askUserToAssociateYaml()

    expect(mockedSetUserConfigValue).not.toBeCalled()
  })

  it('should not set any options if the user cancels the dialog', async () => {
    mockedShowInformationMessage.mockResolvedValueOnce(undefined)
    await askUserToAssociateYaml()

    expect(mockedSetUserConfigValue).not.toBeCalled()
  })
})
