export const isStudioAccessToken = (text?: string): boolean => {
  if (!text) {
    return false
  }
  return text.startsWith('isat_') && text.length >= 53
}

// chose the simplest way to do this, in reality we need a way to
// offer a straightforward way to stop the polling either because the
// user cancels or possibly because were getting errors
export const pollForStudioToken = async (
  tokenUri: string,
  deviceCode: string
): Promise<string> => {
  const response = await fetch(tokenUri, {
    body: JSON.stringify({
      code: deviceCode
    }),
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST'
  })

  if (response.status === 400) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return pollForStudioToken(tokenUri, deviceCode)
  }
  if (response.status !== 200) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return pollForStudioToken(tokenUri, deviceCode)
  }

  const { access_token: accessToken } = (await response.json()) as {
    access_token: string
  }
  return accessToken
}
