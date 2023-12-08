import { isStudioAccessToken } from './studio'

export const validateTokenInput = (input: string | undefined) => {
  if (!isStudioAccessToken(input)) {
    return 'please enter a valid Studio access token'
  }
  return null
}

export const validateUrlInput = (input: string | undefined = '') => {
  try {
    const validUrl = new URL(input)
    if (validUrl) {
      return null
    }
  } catch {}
  return 'please enter a valid URL'
}
