// Sorting by size instead of alphabetical makes more sense here
/* eslint-disable sort-keys-fix/sort-keys-fix */
export const viewports = {
  small: {
    name: 'Small',
    styles: {
      height: '720px',
      width: '1280px'
    },
    type: 'desktop'
  },
  medium: {
    name: 'Medium',
    styles: {
      height: '900px',
      width: '1440px'
    },
    type: 'desktop'
  },
  default: {
    name: 'Default',
    styles: {
      height: '900px',
      width: '1600px'
    },
    type: 'desktop'
  },
  large: {
    name: 'Large',
    styles: {
      height: '1080px',
      width: '1920px'
    },
    type: 'desktop'
  },
  xlarge: {
    name: 'X-Large',
    styles: {
      height: '1440px',
      width: '2560px'
    },
    type: 'desktop'
  }
}

const viewportsWidths = Object.values(viewports)
  .map(viewport => {
    const value = Number.parseInt(viewport.styles.width, 10)

    // Chromatic only allows viewports between 320px and 1800px (https://www.chromatic.com/docs/viewports#what-viewports-can-i-choose)
    return value <= 1800 ? value : null
  })
  .filter(Boolean)

export const chromaticViewports = { viewports: viewportsWidths }

export const chromaticeParameters = {
  chromatic: { viewports: chromaticViewports }
}
