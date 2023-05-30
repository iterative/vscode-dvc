import {
  VSCodePanelTab,
  VSCodePanelView,
  VSCodePanels
} from '@vscode/webview-ui-toolkit/react'
import React, { ReactNode } from 'react'

interface PanelProps {
  panels: { title: string; children: ReactNode }[]
  className: string
}

export const Panels: React.FC<PanelProps> = ({ className, panels }) => {
  return (
    <div className={className}>
      <VSCodePanels>
        {panels.map(panel => (
          <VSCodePanelTab key={`tab-${panel.title}`}>
            {panel.title}
          </VSCodePanelTab>
        ))}
        {panels.map(panel => (
          <VSCodePanelView key={`view-${panel.title}`}>
            {panel.children}
          </VSCodePanelView>
        ))}
      </VSCodePanels>
    </div>
  )
}
