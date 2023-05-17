import { SetupSection } from 'dvc/src/setup/webview/contract'
import { updateSectionCollapsed } from '../../state/webviewSlice'

const getAllSections = (collapsed: boolean) => ({
  [SetupSection.DVC]: collapsed,
  [SetupSection.EXPERIMENTS]: collapsed,
  [SetupSection.REMOTES]: collapsed,
  [SetupSection.STUDIO]: collapsed
})

export const focusSection = (section: SetupSection) =>
  updateSectionCollapsed({
    ...getAllSections(true),
    [section]: false
  })

export const closeSection = (section: SetupSection) =>
  updateSectionCollapsed({
    ...getAllSections(false),
    [section]: true
  })
