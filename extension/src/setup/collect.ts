import { DEFAULT_SECTION_COLLAPSED, SetupSection } from './webview/contract'

export const collectSectionCollapsed = (
  focusedSection?: SetupSection
): typeof DEFAULT_SECTION_COLLAPSED | undefined => {
  if (!focusedSection) {
    return undefined
  }

  const acc = { ...DEFAULT_SECTION_COLLAPSED }
  for (const section of Object.keys(acc)) {
    if (section !== focusedSection) {
      acc[section as SetupSection] = true
    }
  }

  return acc
}
