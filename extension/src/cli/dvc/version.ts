import {
  MAX_CLI_VERSION,
  LATEST_TESTED_CLI_VERSION,
  MIN_CLI_VERSION
} from './constants'
import { Toast } from '../../vscode/toast'

export enum CliCompatible {
  NO_BEHIND_MIN_VERSION = 'no-behind-min-version',
  NO_CANNOT_VERIFY = 'no-cannot-verify',
  NO_MAJOR_VERSION_AHEAD = 'no-major-version-ahead',
  NO_NOT_FOUND = 'no-not-found',
  YES_MINOR_VERSION_AHEAD_OF_TESTED = 'yes-minor-version-ahead-of-tested',
  YES = 'yes'
}

export const cliIsCompatible = (
  cliCompatible: CliCompatible
): boolean | undefined => {
  if (cliCompatible === CliCompatible.NO_NOT_FOUND) {
    return
  }

  return [
    CliCompatible.YES,
    CliCompatible.YES_MINOR_VERSION_AHEAD_OF_TESTED
  ].includes(cliCompatible)
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

export const EXPECTED_VERSION_TEXT = `The expected version is ${MIN_CLI_VERSION} <= DVC < ${MAX_CLI_VERSION}.`

const getWarningText = (
  currentVersion: string,
  update: 'CLI' | 'extension'
): string => `The extension cannot initialize because you are using version ${currentVersion} of the DVC CLI.
${EXPECTED_VERSION_TEXT} Please upgrade to the most recent version of the ${update} and reload this window.`

export const getTextAndSend = (
  version: string,
  update: 'CLI' | 'extension'
): void => {
  const text = getWarningText(version, update)
  Toast.warnWithOptions(text)
}

export const warnAheadOfLatestTested = (): void => {
  Toast.warnWithOptions(`The located DVC CLI is at least a minor version ahead of the latest version the extension was tested with (${LATEST_TESTED_CLI_VERSION}). 
		This could lead to unexpected behaviour. 
		Please upgrade to the most recent version of the extension and reload this window.`)
}

const checkCLIVersion = (currentSemVer: {
  major: number
  minor: number
  patch: number
  // eslint-disable-next-line sonarjs/cognitive-complexity
}): CliCompatible => {
  const {
    major: currentMajor,
    minor: currentMinor,
    patch: currentPatch
  } = currentSemVer

  if (currentMajor >= Number(MAX_CLI_VERSION)) {
    return CliCompatible.NO_MAJOR_VERSION_AHEAD
  }

  const {
    major: minMajor,
    minor: minMinor,
    patch: minPatch
  } = extractSemver(MIN_CLI_VERSION) as ParsedSemver

  if (
    currentMajor < minMajor ||
    currentMinor < minMinor ||
    (currentMinor === minMinor && currentPatch < Number(minPatch))
  ) {
    return CliCompatible.NO_BEHIND_MIN_VERSION
  }

  const { major: latestTestedMajor, minor: latestTestedMinor } = extractSemver(
    LATEST_TESTED_CLI_VERSION
  ) as ParsedSemver

  if (currentMajor === latestTestedMajor && currentMinor > latestTestedMinor) {
    return CliCompatible.YES_MINOR_VERSION_AHEAD_OF_TESTED
  }

  return CliCompatible.YES
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
    typeof currentSemVer.major !== 'number' ||
    typeof currentSemVer.minor !== 'number' ||
    typeof currentSemVer.patch !== 'number' ||
    Number.isNaN(currentSemVer.major) ||
    Number.isNaN(currentSemVer.minor) ||
    Number.isNaN(currentSemVer.patch)
  ) {
    return CliCompatible.NO_CANNOT_VERIFY
  }

  return checkCLIVersion(currentSemVer)
}
