import {
  MAX_CLI_VERSION,
  LATEST_TESTED_CLI_VERSION,
  MIN_CLI_VERSION
} from './contract'

export enum CliCompatible {
  NO_CANNOT_VERIFY = 'no-cannot-verify',
  NO_INCOMPATIBLE = 'no-incompatible',
  NO_NOT_FOUND = 'no-not-found',
  YES_MINOR_VERSION_AHEAD_OF_TESTED = 'yes-minor-version-ahead-of-tested',
  YES = 'yes'
}

export type ParsedSemver = { major: number; minor: number; patch: number }

export const extractSemver = (stdout: string): ParsedSemver | undefined => {
  const semver = stdout.match(/^(\d+\.)?(\d+\.)?(\*|\d+)/)
  if (!semver) {
    return
  }
  const [major, minor, patch] = semver[0].split('.')
  return { major: Number(major), minor: Number(minor), patch: Number(patch) }
}

const cliIsCompatible = (
  currentMajor: number,
  currentMinor: number
): CliCompatible => {
  const { major: latestTestedMajor, minor: latestTestedMinor } = extractSemver(
    LATEST_TESTED_CLI_VERSION
  ) as ParsedSemver

  if (currentMajor === latestTestedMajor && currentMinor > latestTestedMinor) {
    return CliCompatible.YES_MINOR_VERSION_AHEAD_OF_TESTED
  }

  return CliCompatible.YES
}

const checkCLIVersion = (currentSemVer: {
  major: number
  minor: number
  patch: number
}): CliCompatible => {
  const {
    major: currentMajor,
    minor: currentMinor,
    patch: currentPatch
  } = currentSemVer
  const {
    major: minMajor,
    minor: minMinor,
    patch: minPatch
  } = extractSemver(MIN_CLI_VERSION) as ParsedSemver

  const isAheadMaxVersion = currentMajor >= Number(MAX_CLI_VERSION)
  const isBehindMinVersion =
    currentMajor < minMajor ||
    currentMinor < minMinor ||
    (currentMinor === minMinor && currentPatch < Number(minPatch))

  if (isAheadMaxVersion || isBehindMinVersion) {
    return CliCompatible.NO_INCOMPATIBLE
  }

  return cliIsCompatible(currentMajor, currentMinor)
}

export const isVersionCompatible = (
  version: string | undefined
): CliCompatible => {
  if (!version) {
    return CliCompatible.NO_NOT_FOUND
  }

  const currentSemVer = extractSemver(version)

  if (
    !currentSemVer ||
    Number.isNaN(currentSemVer.major) ||
    Number.isNaN(currentSemVer.minor) ||
    Number.isNaN(currentSemVer.patch)
  ) {
    return CliCompatible.NO_CANNOT_VERIFY
  }

  return checkCLIVersion(currentSemVer)
}
