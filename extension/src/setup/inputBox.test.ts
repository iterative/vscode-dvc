import { validateTokenInput } from './inputBox'

describe('validateTokenInput', () => {
  const mockedStudioAccessToken =
    'isat_1Z4T0zVHvq9Cu03XEe9Zjvx2vkBihfGPdY7FfmEMAagOXfQx'
  it('should return the warning if the input is not valid', () => {
    expect(
      validateTokenInput(mockedStudioAccessToken.slice(0, -1))
    ).not.toBeNull()
    expect(
      validateTokenInput(
        mockedStudioAccessToken.slice(1, mockedStudioAccessToken.length)
      )
    ).not.toBeNull()
  })

  it('should return null if the input is valid', () => {
    expect(validateTokenInput(mockedStudioAccessToken)).toBeNull()
  })
})
