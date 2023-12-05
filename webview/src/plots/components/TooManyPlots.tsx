import React, { PropsWithChildren } from 'react'
import styles from './styles.module.scss'
import { MessageBand } from '../../shared/components/messageBand/MessageBand'
import { Info } from '../../shared/components/icons'

const PathHighlight: React.FC<PropsWithChildren> = ({ children }) => (
  <span className={styles.pathHighlight}>{children}</span>
)

export const TooManyPlots: React.FC = () => {
  return (
    <MessageBand icon={Info} id="too-many-plots-message">
      Only 20 plots are shown by default. To view other plots, you can toggle
      their visibility in the sidebar. To toggle multiple plots simultaneously,
      you can group your plots by adding a path prefix to their IDs (
      <PathHighlight>group1/plot1</PathHighlight>,{' '}
      <PathHighlight>group1/plot2</PathHighlight>,{' '}
      <PathHighlight>group2/plot1</PathHighlight>), or place your data inside a
      shared folder (and updating the path in your{' '}
      <PathHighlight>dvc.yaml</PathHighlight> file).
    </MessageBand>
  )
}
