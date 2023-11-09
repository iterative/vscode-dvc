import * as Fetch from 'node-fetch'
import { fetchStudioToken } from './studio'
import { Toast } from '../vscode/toast'

const mockedFetch = jest.mocked(Fetch)
const mockedFetchDefault = jest.fn()
mockedFetch.default = mockedFetchDefault as typeof mockedFetch.default

const mockedToast = jest.mocked(Toast)
const mockedShowError = jest.fn()
mockedToast.showError = mockedShowError

beforeEach(() => {
  jest.resetAllMocks()
})

describe('fetchStudioToken', () => {
  it('should return fetched token', async () => {
    const mockToken = 'isat_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    mockedFetchDefault.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          access_token: mockToken
        }),
      status: 200
    } as Fetch.Response)

    const token = await fetchStudioToken(
      'device-code',
      'https://studio.iterative.ai/api/token'
    )

    expect(mockedFetchDefault).toHaveBeenCalledTimes(1)
    expect(mockedFetchDefault).toHaveBeenCalledWith(
      'https://studio.iterative.ai/api/token',
      {
        body: JSON.stringify({
          code: 'device-code'
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      }
    )
    expect(token).toStrictEqual(mockToken)
  })

  it('should retry if token if not fetched on first attempt', async () => {
    const mockToken = 'isat_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    mockedFetchDefault
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            detail: 'authorization_pending'
          }),
        status: 400
      } as Fetch.Response)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: mockToken
          }),
        status: 200
      } as Fetch.Response)

    const token = await fetchStudioToken(
      'device-code',
      'https://studio.iterative.ai/api/token'
    )

    expect(mockedFetchDefault).toHaveBeenCalledTimes(2)
    expect(token).toStrictEqual(mockToken)
  })

  it('should show a toast message if token fails to be fetched', async () => {
    mockedFetchDefault.mockResolvedValue({
      json: () =>
        Promise.resolve({
          detail: 'unexpected server error'
        }),
      status: 500
    } as Fetch.Response)

    const token = await fetchStudioToken(
      'device-code',
      'https://studio.iterative.ai/api/token'
    )

    expect(mockedFetchDefault).toHaveBeenCalledTimes(2)
    expect(mockedShowError).toHaveBeenCalledTimes(1)
    expect(mockedShowError).toHaveBeenCalledWith(
      'Unable to get token. Please try again later or add an already created token.'
    )
    expect(token).toBeUndefined()
  })
})
