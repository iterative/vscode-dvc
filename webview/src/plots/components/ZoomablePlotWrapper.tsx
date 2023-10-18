import React, { ReactElement, PropsWithChildren } from 'react'
import { VisualizationSpec } from 'react-vega'
import { SpecTitles } from 'dvc/src/plots/vega/util'
import styles from './styles.module.scss'
import Tooltip from '../../shared/components/tooltip/Tooltip'

interface ZoomablePlotWrapperProps {
  title?: string
  spec: VisualizationSpec
}

type SpecWithTitles = VisualizationSpec & {
  titles: SpecTitles
}

const isTitleCut = (title?: string) => title?.indexOf('…') === 0

const getLine = (axis: string, title: string) => {
  if (axis === 'x') {
    return {
      children: (
        <>
          <span className={styles.plotTooltipLabel}>X-axis:</span> {title}
        </>
      ),
      key: 'x'
    }
  }

  if (axis === 'y') {
    return {
      children: (
        <>
          <span className={styles.plotTooltipLabel}>Y-axis:</span> {title}
        </>
      ),
      key: 'y'
    }
  }

  return {
    children: (
      <>
        <span className={styles.plotTooltipLabel}>Title:</span> {title}
      </>
    ),
    key: 'main'
  }
}

export const ZoomablePlotWrapper: React.FC<
  PropsWithChildren<ZoomablePlotWrapperProps>
> = ({ children, spec }) => {
  const tooltipContentLines = []
  for (const [titleKey, title] of Object.entries(
    (spec as SpecWithTitles).titles
  )) {
    if (isTitleCut(title.truncated)) {
      tooltipContentLines.push(getLine(titleKey, title.normal))
    }
  }

  const tooltipContent =
    tooltipContentLines.length > 0 ? (
      <div className={styles.plotTooltip}>
        {tooltipContentLines.map(titleLine => (
          // Key is already defined
          // eslint-disable-next-line react/jsx-key
          <div {...titleLine} className={styles.plotTooltipLine} />
        ))}
      </div>
    ) : null

  return tooltipContent ? (
    <Tooltip
      content={tooltipContent}
      placement="top"
      interactive
      appendTo={document.body}
    >
      {children as ReactElement}
    </Tooltip>
  ) : (
    children
  )
}
