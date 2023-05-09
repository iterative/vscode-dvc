import {
  DEFAULT_SECTION_COLLAPSED,
  SetupSection
} from 'dvc/src/setup/webview/contract'
import React from 'react'
import { useDispatch } from 'react-redux'
import { SectionContainer } from '../../shared/components/sectionContainer/SectionContainer'
import { TooltipIconType } from '../../shared/components/sectionContainer/InfoTooltip'
import { updateSectionCollapsed } from '../state/setupDataSlice'

const getTooltipIconType = (isSetup: boolean, isConnected = true) => {
  if (!isSetup) {
    return TooltipIconType.ERROR
  }

  return isConnected ? TooltipIconType.PASSED : TooltipIconType.INFO
}

export const SetupContainer: React.FC<{
  children: React.ReactNode
  sectionCollapsed: typeof DEFAULT_SECTION_COLLAPSED
  sectionKey: SetupSection
  title: string
  isSetup: boolean
  isConnected?: boolean
}> = ({
  children,
  sectionCollapsed,
  sectionKey,
  title,
  isSetup,
  isConnected
}) => {
  const dispatch = useDispatch()

  return (
    <SectionContainer
      sectionCollapsed={sectionCollapsed[sectionKey]}
      sectionKey={sectionKey}
      title={title}
      icon={getTooltipIconType(isSetup, isConnected)}
      onToggleSection={() =>
        dispatch(
          updateSectionCollapsed({
            ...sectionCollapsed,
            [sectionKey]: !sectionCollapsed[sectionKey]
          })
        )
      }
    >
      {children}
    </SectionContainer>
  )
}
