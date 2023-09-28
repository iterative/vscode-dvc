import { LATEST_TESTED_CLI_VERSION, MIN_CLI_VERSION } from './contract'

export enum CliCompatible {
  NO_CANNOT_VERIFY = 'no-cannot-verify',
  NO_INCOMPATIBLE = 'no-incompatible',
  NO_NOT_FOUND = 'no-not-found',
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

const checkCLIVersion = (
  currentSemVer: {
    major: number
    minor: number
    patch: number
  },
  minSemVer?: string
): CliCompatible => {
  const {
    major: currentMajor,
    minor: currentMinor,
    patch: currentPatch
  } = currentSemVer
  minSemVer = minSemVer || MIN_CLI_VERSION
  const {
    major: minMajor,
    minor: minMinor,
    patch: minPatch
  } = extractSemver(minSemVer) as ParsedSemver

  const isBehindMinVersion =
    currentMajor < minMajor ||
    (currentMajor === minMajor && currentMinor < minMinor) ||
    (currentMinor === minMinor && currentPatch < Number(minPatch))

  if (isBehindMinVersion) {
    return CliCompatible.NO_INCOMPATIBLE
  }

  return CliCompatible.YES
}

export const isVersionCompatible = (
  version: string | undefined,
  required_version?: string | undefined
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

  if (required_version) {
    return checkCLIVersion(currentSemVer, required_version)
  }

  return checkCLIVersion(currentSemVer)
}

export const isAboveLatestTestedVersion = (version: string | undefined) => {
  if (!version) {
    return undefined
  }

  const { major: currentMajor, minor: currentMinor } = extractSemver(
    version
  ) as ParsedSemver

  const { major: latestTestedMajor, minor: latestTestedMinor } = extractSemver(
    LATEST_TESTED_CLI_VERSION
  ) as ParsedSemver

  return (
    currentMajor > latestTestedMajor ||
    (currentMajor === latestTestedMajor && currentMinor > latestTestedMinor)
  )
}
