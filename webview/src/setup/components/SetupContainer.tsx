import {
  DEFAULT_SECTION_COLLAPSED,
  SetupSection
} from 'dvc/src/setup/webview/contract'
import React from 'react'
import { SectionContainer } from '../../shared/components/sectionContainer/SectionContainer'
import { TooltipIconType } from '../../shared/components/sectionContainer/InfoTooltip'

const getTooltipIconType = (
  hasError: boolean,
  isComplete?: boolean | undefined
) => {
  if (hasError) {
    return TooltipIconType.ERROR
  }
  if (isComplete === false) {
    return TooltipIconType.INCOMPLETE
  }

  if (isComplete) {
    return TooltipIconType.PASSED
  }

  return TooltipIconType.INFO
}

export const SetupContainer: React.FC<{
  children: React.ReactNode
  sectionCollapsed: typeof DEFAULT_SECTION_COLLAPSED
  sectionKey: SetupSection
  setSectionCollapsed: (value: typeof DEFAULT_SECTION_COLLAPSED) => void
  title: string
  hasError: boolean
  isComplete?: boolean | undefined
}> = ({
  children,
  sectionCollapsed,
  sectionKey,
  setSectionCollapsed,
  title,
  hasError,
  isComplete
}) => (
  <SectionContainer
    sectionCollapsed={sectionCollapsed[sectionKey]}
    sectionKey={sectionKey}
    title={title}
    icon={getTooltipIconType(hasError, isComplete)}
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
