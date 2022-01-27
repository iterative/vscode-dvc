import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import React, { useState } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { AllIcons, Icon } from '../../../shared/components/icon/Icon'

export interface ComparisonTableRowProps {
  path: string
  plots: ComparisonPlot[]
  nbColumns: number
}

export const ComparisonTableRow: React.FC<ComparisonTableRowProps> = ({
  path,
  plots,
  nbColumns
}) => {
  const [isShown, setIsShown] = useState(true)

  const toggleIsShownState = () => setIsShown(!isShown)

  return (
    <tbody>
      <tr>
        <td colSpan={nbColumns}>
          <button className={styles.rowToggler} onClick={toggleIsShownState}>
            <Icon
              icon={isShown ? AllIcons.CHEVRON_DOWN : AllIcons.CHEVRON_RIGHT}
            />
            {path}
          </button>
        </td>
      </tr>
      <tr>
        {plots.map((plot: ComparisonPlot) => (
          <td key={path + plot.revision}>
            <div className={cx(styles.cell, { [styles.cellHidden]: !isShown })}>
              <img src={plot.url} alt={`Plot of ${path} (${plot.revision})`} />
            </div>
          </td>
        ))}
      </tr>
    </tbody>
  )
}
