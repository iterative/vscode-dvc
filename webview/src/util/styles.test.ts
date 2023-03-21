import { getThemeValue, ThemeProperty } from './styles'

describe('styles', () => {
  it('should get the theme value for the requested property when calling getThemeValue', () => {
    const styleValue = 'blue'

    document.documentElement.style.setProperty(
      ThemeProperty.ACCENT_COLOR,
      styleValue
    )

    expect(getThemeValue(ThemeProperty.ACCENT_COLOR)).toBe(styleValue)
  })
})
