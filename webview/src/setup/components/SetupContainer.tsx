import {
  DEFAULT_SECTION_COLLAPSED,
  SetupSection
} from 'dvc/src/setup/webview/contract'
import React from 'react'
import { SectionContainer } from '../../shared/components/sectionContainer/SectionContainer'
import { TooltipIconType } from '../../shared/components/sectionContainer/InfoTooltip'

export const SetupContainer: React.FC<{
  children: React.ReactNode
  sectionCollapsed: typeof DEFAULT_SECTION_COLLAPSED
  sectionKey: SetupSection
  setSectionCollapsed: (value: typeof DEFAULT_SECTION_COLLAPSED) => void
  title: string
  icon: TooltipIconType
  secondaryTooltipText?: JSX.Element
}> = ({
  children,
  sectionCollapsed,
  sectionKey,
  setSectionCollapsed,
  title,
  icon,
  secondaryTooltipText
}) => (
  <SectionContainer
    sectionCollapsed={sectionCollapsed[sectionKey]}
    sectionKey={sectionKey}
    title={title}
    icon={icon}
    onToggleSection={() =>
      setSectionCollapsed({
        ...sectionCollapsed,
        [sectionKey]: !sectionCollapsed[sectionKey]
      })
    }
    secondaryTooltipText={secondaryTooltipText}
  >
    {children}
  </SectionContainer>
)
