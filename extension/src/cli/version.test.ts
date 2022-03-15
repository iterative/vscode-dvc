import { isVersionCompatible, MIN_VERSION, splitSemver } from './version'
import { Toast } from '../vscode/toast'

jest.mock('../vscode/toast')

const mockedToast = jest.mocked(Toast)
const mockedWarnWithOptions = jest.fn()
mockedToast.warnWithOptions = mockedWarnWithOptions

beforeEach(() => {
  jest.resetAllMocks()
})

describe('splitSemver', () => {
  it('should return undefined if the string does not contain a semver', () => {
    expect(splitSemver('obviously not a version')).toBeUndefined()
  })

  it('should return undefined if the string contains a malformed semver', () => {
    expect(splitSemver('A1.2.1')).toBeUndefined()
  })

  it('should return the expected values from a semver string', () => {
    expect(splitSemver('1.2.1')).toStrictEqual({
      major: 1,
      minor: 2,
      patch: 1
    })
  })

  it('should return the expected values from a dev semver string', () => {
    expect(splitSemver('2.9.6.dev11+gab024a47')).toStrictEqual({
      major: 2,
      minor: 9,
      patch: 6
    })
  })
})

describe('isVersionCompatible', () => {
  const [minMajor, minMinor, minPatch] = MIN_VERSION.split('.')
  it('should send a toast message if the provided version is a patch version before the minimum expected version', async () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    await isVersionCompatible(
      [minMajor, minMinor, Number(minPatch) - 1].join('.')
    )

    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should send a toast message if the provided minor is before the minimum expected version', async () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    await isVersionCompatible(
      [minMajor, Number(minMinor) - 1, Number(minPatch) + 100].join('.')
    )

    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should send a toast message if the provided major version is before the minimum expected version', async () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    await isVersionCompatible(
      [
        Number(minMajor) - 1,
        Number(minMinor) + 1000,
        Number(minPatch) + 100
      ].join('.')
    )

    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should send a toast message if the provided major version is above the expected major version', async () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    await isVersionCompatible('3.0.0')

    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should send a toast message if the provided version is malformed', async () => {
    mockedWarnWithOptions.mockResolvedValueOnce(undefined)

    await isVersionCompatible('not a valid version')

    expect(mockedWarnWithOptions).toBeCalledTimes(1)
  })

  it('should not send a toast message if the provided version matches the min version', async () => {
    await isVersionCompatible(MIN_VERSION)

    expect(mockedWarnWithOptions).not.toBeCalled()
  })
})
