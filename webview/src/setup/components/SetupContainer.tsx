import {
  DEFAULT_SECTION_COLLAPSED,
  SetupSection
} from 'dvc/src/setup/webview/contract'
import React from 'react'
import { SectionContainer } from '../../shared/components/sectionContainer/SectionContainer'
import { TooltipIconType } from '../../shared/components/sectionContainer/InfoTooltip'

const getTooltipIconType = (isSetup: boolean, isDisconnected?: boolean) => {
  if (!isSetup) {
    return TooltipIconType.ERROR
  }

  return isDisconnected ? TooltipIconType.INFO : TooltipIconType.PASSED
}

export const SetupContainer: React.FC<{
  children: React.ReactNode
  sectionCollapsed: typeof DEFAULT_SECTION_COLLAPSED
  sectionKey: SetupSection
  setSectionCollapsed: (value: typeof DEFAULT_SECTION_COLLAPSED) => void
  title: string
  isSetup: boolean
  isDisconnected?: boolean
}> = ({
  children,
  sectionCollapsed,
  sectionKey,
  setSectionCollapsed,
  title,
  isSetup,
  isDisconnected
}) => (
  <SectionContainer
    sectionCollapsed={sectionCollapsed[sectionKey]}
    sectionKey={sectionKey}
    title={title}
    icon={getTooltipIconType(isSetup, isDisconnected)}
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
