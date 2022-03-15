import { getConfigValue, setUserConfigValue } from '../vscode/config'
import { Response } from '../vscode/response'
import { Toast } from '../vscode/toast'

export const MIN_VERSION = '2.9.5'
const MAX_VERSION = '3'
const DO_NOT_WARN_UNEXPECTED_VERSION = 'dvc.doNotWarnCLIVersion'

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

const sendWarning = async (text: string): Promise<void> => {
  const response = await Toast.warnWithOptions(text, Response.NEVER)
  if (response === Response.NEVER) {
    setUserConfigValue(DO_NOT_WARN_UNEXPECTED_VERSION, true)
  }
}

const getTextAndSend = (
  version: string,
  warn: string,
  update: 'CLI' | 'extension'
): Promise<void> => {
  const text = getWarningText(version, warn, update)
  return sendWarning(text)
}

const checkCLIVersion = (
  version: string,
  currentSemVer: { major: number; minor: number; patch: number }
): Promise<void> | void => {
  const {
    major: currentMajor,
    minor: currentMinor,
    patch: currentPatch
  } = currentSemVer

  if (currentMajor >= Number(MAX_VERSION)) {
    return getTextAndSend(version, 'Being a major version ahead', 'extension')
  }

  const [minMajor, minMinor, minPatch] = MIN_VERSION.split('.')

  if (
    currentMajor < Number(minMajor) ||
    currentMinor < Number(minMinor) ||
    currentPatch < Number(minPatch)
  ) {
    return getTextAndSend(
      version,
      `Using any version before ${MIN_VERSION}`,
      'CLI'
    )
  }
}

export const isVersionCompatible = (version: string): Promise<void> | void => {
  if (getConfigValue<boolean>(DO_NOT_WARN_UNEXPECTED_VERSION)) {
    return
  }

  const currentSemVer = extractSemver(version)
  if (!currentSemVer) {
    return sendWarning(
      'Unable to verify the DVC CLI version. The extension could behave in unexpected ways.'
    )
  }

  return checkCLIVersion(version, currentSemVer)
}
