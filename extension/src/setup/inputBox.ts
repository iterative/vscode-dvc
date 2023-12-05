import { isStudioAccessToken } from './studio'

export const validateTokenInput = (input: string | undefined) => {
  if (!isStudioAccessToken(input)) {
    return 'please enter a valid Studio access token'
  }
  return null
}

export const validateUrlInput = (input: string | undefined = '') => {
  try {
    // We're using new URL to check for url validity since it will throw a typeerror if the url isn't valid
    // eslint-disable-next-line no-new
    new URL(input)
    return null
  } catch {
    return 'please enter a valid URL'
  }
}
