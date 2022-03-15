import { Toast } from '../vscode/toast'

export const MIN_VERSION = '2.9.5'
const MAX_VERSION = '3'

export const splitSemver = (
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
) => `You are using version ${currentVersion} of the DVC CLI. The expected version is ${MIN_VERSION} <= DVC < ${MAX_VERSION}.
${warn} will lead to the extension behaving in unexpected ways. It is recommended that you upgrade to the most recent version of the ${update}.`

export const isVersionCompatible = (version: string) => {
  const currentSemVer = splitSemver(version)
  if (!currentSemVer) {
    return Toast.warnWithOptions(
      'Unable to verify the version number of DVC. The extension could behave in unexpected ways.'
    )
  }

  const {
    major: currentMajor,
    minor: currentMinor,
    patch: currentPatch
  } = currentSemVer

  if (currentMajor > 2) {
    const aheadWarning = getWarningText(
      version,
      'Being a major version ahead',
      'extension'
    )
    return Toast.warnWithOptions(aheadWarning)
  }

  const [minMajor, minMinor, minPatch] = MIN_VERSION.split('.')

  if (
    currentMajor < Number(minMajor) ||
    currentMinor < Number(minMinor) ||
    currentPatch < Number(minPatch)
  ) {
    const behindWarning = getWarningText(
      version,
      `Using any version before ${MIN_VERSION}`,
      'CLI'
    )
    return Toast.warnWithOptions(behindWarning)
  }
}
