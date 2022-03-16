import { Toast } from '../vscode/toast'

export const MIN_VERSION = '2.9.5'
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
  warn: string,
  update: 'CLI' | 'extension'
): string => `You are using version ${currentVersion} of the DVC CLI. The expected version is ${MIN_VERSION} <= DVC < ${MAX_VERSION}.
${warn} will lead to the extension behaving in unexpected ways. It is recommended that you upgrade to the most recent version of the ${update}.`

const getTextAndSend = (
  version: string,
  warn: string,
  update: 'CLI' | 'extension'
): void => {
  const text = getWarningText(version, warn, update)
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
    getTextAndSend(version, 'Being a major version ahead', 'extension')
    return false
  }

  const [minMajor, minMinor, minPatch] = MIN_VERSION.split('.')

  if (
    currentMajor < Number(minMajor) ||
    currentMinor < Number(minMinor) ||
    currentPatch < Number(minPatch)
  ) {
    getTextAndSend(version, `Using any version before ${MIN_VERSION}`, 'CLI')
    return false
  }

  return true
}

export const isVersionCompatible = (version: string): boolean => {
  const currentSemVer = extractSemver(version)
  if (!currentSemVer) {
    Toast.warnWithOptions(
      'Unable to verify the DVC CLI version. The extension could behave in unexpected ways.'
    )
    return false
  }

  return checkCLIVersion(version, currentSemVer)
}
