import { DEFAULT_SECTION_COLLAPSED, Section } from './webview/contract'

export const collectSectionCollapsed = (
  focusedSection?: Section
): typeof DEFAULT_SECTION_COLLAPSED | undefined => {
  if (!focusedSection) {
    return undefined
  }

  const acc = { ...DEFAULT_SECTION_COLLAPSED }
  for (const section of Object.keys(acc)) {
    if (section !== focusedSection) {
      acc[section as Section] = true
    }
  }

  return acc
}
