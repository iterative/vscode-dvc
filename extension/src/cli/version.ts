import { Toast } from '../vscode/toast'

export const MIN_VERSION = '2.10.0'
const MAX_VERSION = '3'

export const extractSemver = (
  stdout: string
): { major: number; minor: number; patch: number } | undefined => {
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
The expected version is ${MIN_VERSION} <= DVC < ${MAX_VERSION}. Please upgrade to the most recent version of the ${update} and reload this window.`

const getTextAndSend = (version: string, update: 'CLI' | 'extension'): void => {
  const text = getWarningText(version, update)
  Toast.warnWithOptions(text)
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

  if (currentMajor >= Number(MAX_VERSION)) {
    getTextAndSend(version, 'extension')
    return false
  }

  const [minMajor, minMinor, minPatch] = MIN_VERSION.split('.')

  if (
    currentMajor < Number(minMajor) ||
    currentMinor < Number(minMinor) ||
    currentPatch < Number(minPatch)
  ) {
    getTextAndSend(version, 'CLI')
    return false
  }

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
