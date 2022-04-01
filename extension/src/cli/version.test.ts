import { isVersionCompatible, MIN_VERSION, extractSemver } from './version'
import { Toast } from '../vscode/toast'

jest.mock('../vscode/config')
jest.mock('../vscode/toast')

const mockedToast = jest.mocked(Toast)
const mockedWarnWithOptions = jest.fn()
mockedToast.warnWithOptions = mockedWarnWithOptions

beforeEach(() => {
  jest.resetAllMocks()
})

describe('extractSemver', () => {
  it('should return undefined if the string does not contain a semver', () => {
    expect(extractSemver('obviously not a version')).toBeUndefined()
  })

  it('should return undefined if the string contains a malformed semver', () => {
    expect(extractSemver('A1.2.1')).toBeUndefined()
  })

  it('should return the expected values from a semver string', () => {
    expect(extractSemver('1.2.1')).toStrictEqual({
      major: 1,
      minor: 2,
      patch: 1
    })
  })

  it('should return the expected values from a dev semver string', () => {
    expect(extractSemver('2.9.6.dev11+gab024a47')).toStrictEqual({
      major: 2,
      minor: 9,
      patch: 6
    })
  })
})

describe('isVersionCompatible', () => {
  const [minMajor, minMinor, minPatch] = MIN_VERSION.split('.')
  it('should send a toast message if the provided version is a patch version before the minimum expected version', () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    const mockVersion = [
      minMajor,
      minMinor,
      Math.max(Number(minPatch) - 1, 0)
    ].join('.')

    const isSame = mockVersion === MIN_VERSION
    const isCompatible = isVersionCompatible(mockVersion)

    expect(isCompatible).toBe(isSame)
    expect(mockedWarnWithOptions).toBeCalledTimes(isSame ? 0 : 1)
  })

  it('should send a toast message if the provided minor version is before the minimum expected version', () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    const isCompatible = isVersionCompatible(
      [minMajor, Number(minMinor) - 1, Number(minPatch) + 100].join('.')
    )

    expect(isCompatible).toBe(false)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should send a toast message if the provided major version is before the minimum expected version', () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    const isCompatible = isVersionCompatible(
      [
        Number(minMajor) - 1,
        Number(minMinor) + 1000,
        Number(minPatch) + 100
      ].join('.')
    )

    expect(isCompatible).toBe(false)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should send a toast message if the provided major version is above the expected major version', () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    const isCompatible = isVersionCompatible('3.0.0')

    expect(isCompatible).toBe(false)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should send a toast message if the provided version is malformed', () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    const isCompatible = isVersionCompatible('not a valid version')

    expect(isCompatible).toBe(false)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should not send a toast message if the provided version matches the min version', () => {
    const isCompatible = isVersionCompatible(MIN_VERSION)

    expect(isCompatible).toBe(true)
    expect(mockedWarnWithOptions).not.toBeCalled()
  })
})
