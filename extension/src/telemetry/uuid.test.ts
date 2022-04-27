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
const mockedConfig = { user_id: mockedUserId }

describe('readOrCreateUserId', () => {
  it('should try to migrate the legacy DVC config if the new config cannot be found', () => {
    mockedExists.mockReturnValueOnce(false).mockReturnValueOnce(true)
    mockedReadJson.mockReturnValueOnce(mockedConfig)

    readOrCreateUserId()
    expect(mockedWriteJson).toBeCalledTimes(1)
    expect(mockedWriteJson).toBeCalledWith(
      expect.stringContaining(sep + 'telemetry'),
      mockedConfig
    )
  })

  it('should create a completely new config if neither config can be found', () => {
    mockedExists.mockReturnValueOnce(false).mockReturnValueOnce(false)

    readOrCreateUserId()
    expect(mockedReadJson).not.toBeCalled()
    expect(mockedWriteJson).toBeCalledTimes(1)
    expect(mockedWriteJson).toBeCalledWith(
      expect.stringContaining(sep + 'telemetry'),
      expect.objectContaining({ user_id: expect.stringContaining('-') })
    )
  })
})

describe('getUserId', () => {
  it('should only try to access the value from the fileSystem on the first call', () => {
    mockedExists.mockReturnValueOnce(true)
    mockedReadJson.mockReturnValueOnce(mockedConfig)

    const user_id = getUserId()

    expect(user_id).toStrictEqual(mockedUserId)
    expect(mockedExists).toBeCalledTimes(1)
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
