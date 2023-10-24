import React, { ReactElement, PropsWithChildren } from 'react'
import { SpecWithTitles } from 'dvc/src/plots/vega/util'
import styles from './styles.module.scss'
import Tooltip from '../../shared/components/tooltip/Tooltip'

interface ZoomablePlotWrapperProps {
  title?: string
  spec: SpecWithTitles
}

const isTitleCut = (title?: string) => title?.indexOf('…') === 0

const getLine = (axis: string, title: string) => {
  if (axis === 'x' || axis === 'y') {
    return {
      children: (
        <>
          <span className={styles.plotTooltipLabel}>
            {axis.toUpperCase()}-axis:
          </span>{' '}
          {title}
        </>
      ),
      key: axis
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
  for (const [titleKey, title] of Object.entries(spec.titles)) {
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
