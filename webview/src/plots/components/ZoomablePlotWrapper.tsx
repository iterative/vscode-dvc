import React, { ReactElement, PropsWithChildren } from 'react'
import { AnchorDefinitions } from 'dvc/src/cli/dvc/contract'
import styles from './styles.module.scss'
import Tooltip from '../../shared/components/tooltip/Tooltip'

interface ZoomablePlotWrapperProps {
  title?: string
  titles: Partial<AnchorDefinitions> | undefined
}

const isTitleCut = (
  title: string | undefined,
  maxLength: number
): title is string => !!(title && title.length >= maxLength)

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
> = ({ children, titles }) => {
  if (!titles) {
    return children
  }

  const titleLengths = {
    '<DVC_METRIC_TITLE>': 50,
    '<DVC_METRIC_X_LABEL>': 50,
    '<DVC_METRIC_Y_LABEL>': 30
  }
  const tooltipContentLines = []
  // Pull out a constant.... weeeeeee

  for (const [titleKey, maxLength] of Object.entries(titleLengths)) {
    const title = titles[titleKey as keyof AnchorDefinitions]
    if (isTitleCut(title, maxLength)) {
      tooltipContentLines.push(getLine(titleKey, title))
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
