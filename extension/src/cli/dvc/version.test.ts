import {
  isVersionCompatible,
  extractSemver,
  ParsedSemver,
  CliCompatible,
  isAboveLatestTestedVersion
} from './version'
import { MIN_CLI_VERSION, LATEST_TESTED_CLI_VERSION } from './contract'

jest.mock('./contract', () => ({
  ...jest.requireActual('./contract'),
  LATEST_TESTED_CLI_VERSION: '2.11.1',
  MIN_CLI_VERSION: '2.9.4'
}))
jest.mock('../../vscode/config')

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

  const {
    major: latestTestedMajor,
    minor: latestTestedMinor,
    patch: latestTestedPatch
  } = extractSemver(LATEST_TESTED_CLI_VERSION) as ParsedSemver

  it('should be compatible if the provided version matches the min version', () => {
    const isCompatible = isVersionCompatible(MIN_CLI_VERSION)

    expect(isCompatible).toStrictEqual(CliCompatible.YES)
  })

  it('should be compatible for a version with the same minor and higher patch as the min compatible version', () => {
    const isCompatible = isVersionCompatible(
      [minMajor, minMinor, minPatch + 10000].join('.')
    )

    expect(isCompatible).toStrictEqual(CliCompatible.YES)
  })

  it('should be compatible for a version with the same minor and higher patch as the latest tested version', () => {
    const isCompatible = isVersionCompatible(
      [latestTestedMajor, latestTestedMinor, latestTestedPatch + 10000].join(
        '.'
      )
    )

    expect(isCompatible).toStrictEqual(CliCompatible.YES)
  })

  it('should be compatible for a major and minor version in between the min compatible and the latest tested', () => {
    expect(minMinor + 1).toBeLessThan(latestTestedMinor)
    expect(minMajor).toStrictEqual(latestTestedMajor)

    const isCompatible = isVersionCompatible(
      [minMajor, minMinor + 1, 0].join('.')
    )

    expect(isCompatible).toStrictEqual(CliCompatible.YES)
  })

  it('should be compatible for a version with a minor higher as the latest tested minor and any patch', () => {
    expect(0).toBeLessThan(latestTestedPatch)

    let isCompatible = isVersionCompatible(
      [latestTestedMajor, latestTestedMinor + 1, 0].join('.')
    )

    expect(isCompatible).toStrictEqual(CliCompatible.YES)

    isCompatible = isVersionCompatible(
      [latestTestedMajor, latestTestedMinor + 1, latestTestedPatch + 1000].join(
        '.'
      )
    )

    expect(isCompatible).toStrictEqual(CliCompatible.YES)

    isCompatible = isVersionCompatible(
      [latestTestedMajor, latestTestedMinor + 1, latestTestedPatch].join('.')
    )

    expect(isCompatible).toStrictEqual(CliCompatible.YES)
  })

  it('should return not found if the version provided is undefined', () => {
    const isCompatible = isVersionCompatible(undefined)

    expect(isCompatible).toStrictEqual(CliCompatible.NO_NOT_FOUND)
  })

  it('should return behind incompatible if the provided version is a patch version before the minimum expected version', () => {
    const isCompatible = isVersionCompatible(
      [minMajor, minMinor, minPatch - 1].join('.')
    )

    expect(isCompatible).toStrictEqual(CliCompatible.NO_INCOMPATIBLE)
  })

  it('should return behind incompatible if the provided minor version is before the minimum expected version', () => {
    const isCompatible = isVersionCompatible(
      [minMajor, minMinor - 1, minPatch + 100].join('.')
    )

    expect(isCompatible).toStrictEqual(CliCompatible.NO_INCOMPATIBLE)
  })

  it('should return behind incompatible if the provided major version is before the minimum expected version', () => {
    const isCompatible = isVersionCompatible(
      [minMajor - 1, minMinor + 1000, minPatch + 100].join('.')
    )

    expect(isCompatible).toStrictEqual(CliCompatible.NO_INCOMPATIBLE)
  })

  it('should return incompatible if the provided major version is above the expected major version', () => {
    const isCompatible = isVersionCompatible('3.0.0')

    expect(isCompatible).toStrictEqual(CliCompatible.NO_INCOMPATIBLE)
  })

  it('should return cannot verify if the provided version is malformed', () => {
    let isCompatible = isVersionCompatible('not a valid version')

    expect(isCompatible).toStrictEqual(CliCompatible.NO_CANNOT_VERIFY)

    isCompatible = isVersionCompatible('1,2,3')

    expect(isCompatible).toStrictEqual(CliCompatible.NO_CANNOT_VERIFY)
  })
})

describe('isAboveLatestTestedVersion', () => {
  it('should return undefined if version is undefined', () => {
    const result = isAboveLatestTestedVersion(undefined)

    expect(result).toStrictEqual(undefined)
  })

  it('should return true for a version with a minor higher as the latest tested minor and any patch', () => {
    const {
      major: latestTestedMajor,
      minor: latestTestedMinor,
      patch: latestTestedPatch
    } = extractSemver(LATEST_TESTED_CLI_VERSION) as ParsedSemver

    expect(0).toBeLessThan(latestTestedPatch)

    let result = isAboveLatestTestedVersion(
      [latestTestedMajor, latestTestedMinor + 1, 0].join('.')
    )

    expect(result).toStrictEqual(true)

    result = isAboveLatestTestedVersion(
      [latestTestedMajor, latestTestedMinor + 1, latestTestedPatch + 1000].join(
        '.'
      )
    )

    expect(result).toStrictEqual(true)

    result = isAboveLatestTestedVersion(
      [latestTestedMajor, latestTestedMinor + 1, latestTestedPatch].join('.')
    )

    expect(result).toStrictEqual(true)
  })

  it('should return false if version is below the latest tested version', () => {
    const result = isAboveLatestTestedVersion(MIN_CLI_VERSION)

    expect(result).toStrictEqual(false)
  })
})
