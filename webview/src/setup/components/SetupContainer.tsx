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
  disabled?: boolean
}> = ({
  children,
  sectionCollapsed,
  sectionKey,
  setSectionCollapsed,
  title,
  disabled
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
    disabled={disabled}
  >
    {children}
  </SectionContainer>
)
