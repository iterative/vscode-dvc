export const STUDIO_ACCESS_TOKEN_KEY = 'dvc.studioAccessToken'

export const isStudioAccessToken = (text?: string): boolean => {
  if (!text) {
    return false
  }
  return text.startsWith('isat_') && text.length >= 53
}
