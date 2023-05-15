import { SetupSection } from 'dvc/src/setup/webview/contract'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SectionContainer } from '../../shared/components/sectionContainer/SectionContainer'
import { TooltipIconType } from '../../shared/components/sectionContainer/InfoTooltip'
import { toggleSectionCollapsed } from '../state/webviewSlice'
import { SetupState } from '../store'

export const SetupContainer: React.FC<{
  children: React.ReactNode
  sectionKey: SetupSection
  title: string
  icon: TooltipIconType
  secondaryTooltipText?: JSX.Element
}> = ({ children, sectionKey, title, icon }) => {
  const sectionCollapsed = useSelector(
    (state: SetupState) => state.webview.sectionCollapsed
  )
  const dispatch = useDispatch()

  return (
    <SectionContainer
      sectionCollapsed={sectionCollapsed[sectionKey]}
      sectionKey={sectionKey}
      title={title}
      icon={icon}
      onToggleSection={() => dispatch(toggleSectionCollapsed(sectionKey))}
    >
      {children}
    </SectionContainer>
  )
}
