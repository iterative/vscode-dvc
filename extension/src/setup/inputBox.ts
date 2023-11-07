import { isStudioAccessToken } from './studio'

export const validateTokenInput = (input: string | undefined) => {
  if (!isStudioAccessToken(input)) {
    return 'please enter a valid Studio access token'
  }
  return null
}
