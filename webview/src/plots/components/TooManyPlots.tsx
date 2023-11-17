import React, { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { PlotsState } from '../store'
import { MessageBand } from '../../shared/components/messageBand/MessageBand'
import { Info } from '../../shared/components/icons'

const PathHiglight: React.FC<PropsWithChildren> = ({ children }) => (
  <span className={styles.pathHighlight}>{children}</span>
)

export const TooManyPlots: React.FC = () => {
  const shouldShow = useSelector(
    (state: PlotsState) => state.webview.shouldShowTooManyPlotsMessage
  )

  return shouldShow ? (
    <MessageBand icon={Info}>
      We are only showing 20 plots by default. To view other plots, you can
      toggle their visibility in the sidebar. You can also group your plots by
      adding a path prefix to their IDs (
      <PathHiglight>group1/plot1</PathHiglight>,{' '}
      <PathHiglight>group1/plot2</PathHiglight>,{' '}
      <PathHiglight>group2/plot1</PathHiglight>) to toggle multiple plots
      simultaneously.
    </MessageBand>
  ) : null
}
