import { LivePlotData, LivePlotsColors } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState } from 'react'
import { EmptyState } from './EmptyState'
import { Plot } from './Plot'
import styles from './styles.module.scss'
import { DragDropContainer } from '../../shared/components/dragDrop/DragDropContainer'
import { AllIcons, Icon } from '../../shared/components/icon/Icon'
import { performOrderedUpdate } from '../../util/objects'
import { withScale } from '../../util/styles'

interface LivePlotsProps {
  plots: LivePlotData[]
  colors: LivePlotsColors
}

export const LivePlots: React.FC<LivePlotsProps> = ({ plots, colors }) => {
  const [order, setOrder] = useState(plots.map(plot => plot.title))

  useEffect(() => {
    setOrder(pastOrder => performOrderedUpdate(pastOrder, plots, 'title'))
  }, [plots])

  const items = order
    .map(plot => {
      const plotData = plots.find(p => p.title === plot)
      if (!plotData) {
        return
      }
      const { title, values } = plotData
      const key = `plot-${title}`
      return (
        <div
          className={styles.plot}
          style={withScale(1)}
          id={title}
          key={key}
          data-testid={key}
        >
          <Icon
            icon={AllIcons.GRIPPPER}
            color="#ffffff"
            width={30}
            height={30}
            className={styles.plotGripIcon}
          />
          <Plot values={values} scale={colors} title={title} />
        </div>
      )
    })
    .filter(Boolean)

  return plots.length ? (
    <div className={styles.singleViewPlotsGrid}>
      <DragDropContainer
        order={order}
        setOrder={setOrder}
        disabledDropIds={[]}
        items={items as JSX.Element[]}
      />
    </div>
  ) : (
    EmptyState('No metrics selected')
  )
}
