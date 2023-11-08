import { Uri, env, window } from 'vscode'
import { getCallBackUrl, openUrl, waitForUriResponse } from './external'

const mockedEnv = jest.mocked(env)
const mockedOpenExternal = jest.fn()
const mockedAsExternalUri = jest.fn()
const mockedUriScheme = 'vscode'
mockedEnv.openExternal = mockedOpenExternal
mockedEnv.asExternalUri = mockedAsExternalUri
mockedEnv.uriScheme = mockedUriScheme

const mockedParseUri = jest.fn()
Uri.parse = mockedParseUri

const mockedWindow = jest.mocked(window)
const mockedRegisterUriHandler = jest.fn()
mockedWindow.registerUriHandler = mockedRegisterUriHandler

beforeEach(() => {
  jest.resetAllMocks()
})

describe('openUrl', () => {
  it('should call env.openExternal with the provided url', async () => {
    const mockUrl = 'https://github.com/iterative/vscode-dvc'
    const mockUri = Uri.from({
      authority: 'github.com',
      scheme: 'https'
    })
    mockedParseUri.mockReturnValueOnce(mockUri)

    await openUrl(mockUrl)

    expect(mockedOpenExternal).toHaveBeenCalledTimes(1)
    expect(mockedOpenExternal).toHaveBeenCalledWith(mockUri)
  })
})

describe('getCallbackUrl', () => {
  it('should return a vscode uri with the provided path', async () => {
    const mockUrl = `${mockedUriScheme}://iterative.dvc/path`
    const mockUri = Uri.from({
      authority: 'iterative.dvc',
      path: '/path',
      scheme: mockedUriScheme
    })
    mockedParseUri.mockReturnValueOnce(mockUri)
    mockedAsExternalUri.mockResolvedValueOnce(mockUri)

    const result = await getCallBackUrl('/path')

    expect(mockedParseUri).toHaveBeenCalledTimes(1)
    expect(mockedParseUri).toHaveBeenCalledWith(mockUrl)
    expect(mockedAsExternalUri).toHaveBeenCalledTimes(1)
    expect(mockedAsExternalUri).toHaveBeenCalledWith(mockUri)
    expect(result).toStrictEqual(mockUri.toString())
  })
})

describe('waitForUriResponse', () => {
  it('should register a uri handler with the provided options', () => {
    const mockOnResponse = jest.fn()
    let mockHandleUriResponse = (uri: Uri) => uri
    mockedRegisterUriHandler.mockImplementationOnce(({ handleUri }) => {
      mockHandleUriResponse = handleUri
    })
    void waitForUriResponse('/path', mockOnResponse)
    expect(mockedRegisterUriHandler).toHaveBeenCalledTimes(1)

    const uriWithoutPath = Uri.from({
      authority: 'iterative.dvc',
      path: '/not-correct-path',
      scheme: mockedUriScheme
    })
    mockHandleUriResponse(uriWithoutPath)
    expect(mockOnResponse).not.toHaveBeenCalled()

    const uriWithPath = Uri.from({
      authority: 'iterative.dvc',
      path: '/path',
      scheme: mockedUriScheme
    })
    mockHandleUriResponse(uriWithPath)
    expect(mockOnResponse).toHaveBeenCalledTimes(1)
  })
})
