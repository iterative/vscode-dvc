import {
  DEFAULT_SECTION_COLLAPSED,
  SetupSection
} from 'dvc/src/setup/webview/contract'
import React from 'react'
import { SectionContainer } from '../../shared/components/sectionContainer/SectionContainer'

export const SetupContainer: React.FC<{
  children: React.ReactNode
  sectionCollapsed: typeof DEFAULT_SECTION_COLLAPSED
  sectionKey: SetupSection
  setSectionCollapsed: (value: typeof DEFAULT_SECTION_COLLAPSED) => void
  title: string
}> = ({
  children,
  sectionCollapsed,
  sectionKey,
  setSectionCollapsed,
  title
}) => (
  <SectionContainer
    sectionCollapsed={sectionCollapsed[sectionKey]}
    sectionKey={sectionKey}
    title={title}
    onToggleSection={() =>
      setSectionCollapsed({
        ...sectionCollapsed,
        [sectionKey]: !sectionCollapsed[sectionKey]
      })
    }
  >
    {children}
  </SectionContainer>
)
