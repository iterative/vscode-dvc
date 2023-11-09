import cx from 'classnames'
import React from 'react'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import styles from './styles.module.scss'
import { getMetricVsParamTitle } from './util'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'
import { Icon } from '../../shared/components/Icon'
import { GraphLine } from '../../shared/components/icons'
import { useGetPlot } from '../hooks/useGetPlot'

interface DragAndDropPlotProps {
  plot: string
  sectionKey: PlotsSection
}

export const DragAndDropPlot: React.FC<DragAndDropPlotProps> = ({
  plot,
  sectionKey
}) => {
  const { spec, isTemplatePlot } = useGetPlot(sectionKey, plot)

  let title = spec?.titles.main.normal as unknown as string
  let subtitle = ''

  if (!isTemplatePlot) {
    const yTitle = spec?.titles.y.normal as unknown as string
    const xTitle = spec?.titles.x.normal as unknown as string

    title = getMetricVsParamTitle(yTitle, xTitle)
    subtitle = plot.replace('custom-', '')
  }

  return (
    <>
      <div>
        <GripIcon className={styles.plotGripIcon} />
      </div>
      <div className={styles.dragAndDropPlotContent}>
        <h2 className={styles.dragAndDropPlotTitle}>{title}</h2>
        {subtitle && (
          <h3 className={styles.dragAndDropPlotSubtitle}>{subtitle}</h3>
        )}
        <Icon
          icon={GraphLine}
          className={cx(styles.dropIcon, styles.smallDropIcon)}
          width={30}
          height={30}
        />
      </div>
    </>
  )
}
