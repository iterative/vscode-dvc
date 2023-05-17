import { SetupSection } from 'dvc/src/setup/webview/contract'
import { updateSectionCollapsed } from '../../state/webviewSlice'

const getAllSections = (collaspsed: boolean) => ({
  [SetupSection.DVC]: collaspsed,
  [SetupSection.EXPERIMENTS]: collaspsed,
  [SetupSection.REMOTES]: collaspsed,
  [SetupSection.STUDIO]: collaspsed
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
