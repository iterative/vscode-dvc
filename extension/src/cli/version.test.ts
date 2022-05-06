import { isVersionCompatible, extractSemver, ParsedSemver } from './version'
import { MIN_CLI_VERSION } from './constants'
import { Toast } from '../vscode/toast'

jest.mock('./constants', () => ({
  ...jest.requireActual('./constants'),
  MIN_CLI_VERSION: '2.9.4'
}))
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
  const {
    major: minMajor,
    minor: minMinor,
    patch: minPatch
  } = extractSemver(MIN_CLI_VERSION) as ParsedSemver

  it('should be compatible and not send a toast message if the provided version matches the min version', () => {
    const isCompatible = isVersionCompatible(MIN_CLI_VERSION)

    expect(isCompatible).toBe(true)
    expect(mockedWarnWithOptions).not.toBeCalled()
  })

  it('should be compatible and not send a toast for a version with the same minor and higher patch', () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    const isCompatible = isVersionCompatible(
      [minMajor, minMinor, minPatch + 10000].join(',')
    )

    expect(isCompatible).toBe(true)
    expect(mockedWarnWithOptions).not.toBeCalled()
  })

  it('should be compatible but send a toast for a version with a higher minor but lower patch', () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    const isCompatible = isVersionCompatible('2.10.0')

    expect(isCompatible).toBe(true)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should not be compatible and send a toast message if the provided version is a patch version before the minimum expected version', () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    const isCompatible = isVersionCompatible(
      [minMajor, minMinor, minPatch - 1].join('.')
    )

    expect(isCompatible).toBe(false)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should not be compatible and send a toast message if the provided minor version is before the minimum expected version', () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    const isCompatible = isVersionCompatible(
      [minMajor, minMinor - 1, minPatch + 100].join('.')
    )

    expect(isCompatible).toBe(false)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should not be compatible and send a toast message if the provided major version is before the minimum expected version', () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    const isCompatible = isVersionCompatible(
      [minMajor - 1, minMinor + 1000, minPatch + 100].join('.')
    )

    expect(isCompatible).toBe(false)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should not be compatible and send a toast message if the provided major version is above the expected major version', () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    const isCompatible = isVersionCompatible('3.0.0')

    expect(isCompatible).toBe(false)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should not be compatible and send a toast message if the provided version is malformed', () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    const isCompatible = isVersionCompatible('not a valid version')

    expect(isCompatible).toBe(false)
    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })
})
