import cx from 'classnames'
import React from 'react'
import styles from './styles.module.scss'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'
import { Icon } from '../../shared/components/Icon'
import { GraphLine } from '../../shared/components/icons'

interface DragAndDropPlotProps {
  plot: string
}

export const DragAndDropPlot: React.FC<DragAndDropPlotProps> = ({ plot }) => {
  return (
    <>
      <div>
        <GripIcon className={styles.plotGripIcon} />
      </div>
      <div className={styles.dragAndDropPlotContent}>
        <h2 className={styles.dragAndDropPlotTitle}>{plot}</h2>
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
