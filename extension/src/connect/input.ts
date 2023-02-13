const isStudioAccessToken = (text?: string): boolean => {
  if (!text) {
    return false
  }
  return text.startsWith('isat_') && text.length === 54
}

export const validateTokenInput = (input: string | undefined) => {
  if (!isStudioAccessToken(input)) {
    return 'please enter a valid Studio access token'
  }
  return null
}
