import { MAX_CLI_VERSION, MIN_CLI_VERSION } from './constants'
import { Toast } from '../vscode/toast'

export type ParsedSemver = { major: number; minor: number; patch: number }

export const extractSemver = (stdout: string): ParsedSemver | undefined => {
  const semver = stdout.match(/^(\d+\.)?(\d+\.)?(\*|\d+)/)
  if (!semver) {
    return
  }
  const [major, minor, patch] = semver[0].split('.')
  return { major: Number(major), minor: Number(minor), patch: Number(patch) }
}

const getWarningText = (
  currentVersion: string,
  update: 'CLI' | 'extension'
): string => `The extension cannot initialize because you are using version ${currentVersion} of the DVC CLI.
The expected version is ${MIN_CLI_VERSION} <= DVC < ${MAX_CLI_VERSION}. Please upgrade to the most recent version of the ${update} and reload this window.`

const getTextAndSend = (version: string, update: 'CLI' | 'extension'): void => {
  const text = getWarningText(version, update)
  Toast.warnWithOptions(text)
}

const warnIfMinorAhead = (
  currentMajor: number,
  minMajor: number,
  currentMinor: number,
  minMinor: number
) => {
  if (currentMajor === minMajor && currentMinor > minMinor) {
    Toast.warnWithOptions(`The located version of the CLI is at least a minor version ahead of the expected version. 
		This could lead to unexpected behaviour. 
		Please upgrade to the most recent version of the extension and reload this window.`)
  }
}

const checkCLIVersion = (
  version: string,
  currentSemVer: { major: number; minor: number; patch: number }
): boolean => {
  const {
    major: currentMajor,
    minor: currentMinor,
    patch: currentPatch
  } = currentSemVer

  if (currentMajor >= Number(MAX_CLI_VERSION)) {
    getTextAndSend(version, 'extension')
    return false
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
    getTextAndSend(version, 'CLI')
    return false
  }

  warnIfMinorAhead(currentMajor, minMajor, currentMinor, minMinor)

  return true
}

export const isVersionCompatible = (version: string): boolean => {
  const currentSemVer = extractSemver(version)
  if (!currentSemVer) {
    Toast.warnWithOptions(
      'The extension cannot initialize as we were unable to verify the DVC CLI version.'
    )
    return false
  }

  return checkCLIVersion(version, currentSemVer)
}
