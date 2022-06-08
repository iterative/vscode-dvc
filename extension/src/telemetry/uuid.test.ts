import { sep } from 'path'
import { v4 } from 'uuid'
import { getUserId, readOrCreateUserId } from './uuid'
import { exists, loadJson, writeJson } from '../fileSystem'

const mockedExists = jest.mocked(exists)
const mockedReadJson = jest.mocked(loadJson)
const mockedWriteJson = jest.mocked(writeJson)

jest.mock('../fileSystem')

beforeEach(() => {
  jest.resetAllMocks()
})

const mockedUserId = v4()
const mockedConfig = { 'do-not-track': true, user_id: mockedUserId }

describe('readOrCreateUserId', () => {
  it('should create two completely new configs if neither config can be found', () => {
    mockedExists.mockReturnValueOnce(false).mockReturnValueOnce(false)

    readOrCreateUserId()
    expect(mockedReadJson).not.toBeCalled()
    expect(mockedWriteJson).toBeCalledTimes(2)
    expect(mockedWriteJson).toBeCalledWith(
      expect.stringContaining(sep + 'telemetry'),
      expect.objectContaining({ user_id: expect.stringContaining('-') })
    )
  })

  it('should migrate the legacy DVC config if the new config cannot be found', () => {
    mockedExists.mockReturnValueOnce(true).mockReturnValueOnce(false)
    mockedReadJson.mockReturnValueOnce(mockedConfig)

    readOrCreateUserId()
    expect(mockedWriteJson).toBeCalledTimes(1)
    expect(mockedWriteJson).toBeCalledWith(
      expect.stringContaining(sep + 'telemetry'),
      mockedConfig
    )
    expect(mockedWriteJson).not.toBeCalledWith(
      expect.stringContaining('dvc'),
      mockedConfig
    )
  })

  it('should create a legacy config if only the new one can be found', () => {
    mockedExists.mockReturnValueOnce(false).mockReturnValueOnce(true)
    mockedReadJson.mockReturnValueOnce(mockedConfig)

    readOrCreateUserId()
    expect(mockedReadJson).toBeCalledTimes(1)
    expect(mockedWriteJson).toBeCalledTimes(1)

    expect(mockedWriteJson).not.toBeCalledWith(
      expect.stringContaining(sep + 'telemetry'),
      mockedConfig
    )

    expect(mockedWriteJson).toBeCalledWith(
      expect.stringContaining('dvc'),
      expect.objectContaining({ user_id: expect.stringContaining('-') })
    )
  })

  it('should overwrite the user_id in the new config if it differs from the legacy id', () => {
    mockedExists.mockReturnValueOnce(true).mockReturnValueOnce(true)
    mockedReadJson
      .mockReturnValueOnce(mockedConfig)
      .mockReturnValueOnce({ 'some-other-info': true, user_id: 'bogus-id' })

    readOrCreateUserId()
    expect(mockedReadJson).toBeCalledTimes(2)
    expect(mockedWriteJson).toBeCalledTimes(1)

    expect(mockedWriteJson).toBeCalledWith(
      expect.stringContaining(sep + 'telemetry'),
      {
        'do-not-track': true,
        'some-other-info': true,
        user_id: expect.not.stringMatching('bogus-id')
      }
    )
  })
})

describe('getUserId', () => {
  it('should only try to access the value from the fileSystem on the first call', () => {
    mockedExists.mockReturnValueOnce(true)
    mockedReadJson.mockReturnValueOnce(mockedConfig)

    const user_id = getUserId()

    expect(user_id).toStrictEqual(mockedUserId)
    expect(mockedExists).toBeCalledTimes(2)
    expect(mockedReadJson).toBeCalledTimes(1)

    mockedExists.mockClear()
    mockedReadJson.mockClear()

    getUserId()
    getUserId()
    getUserId()

    expect(mockedExists).not.toBeCalled()
    expect(mockedReadJson).not.toBeCalled()
  })
})
