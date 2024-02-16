import React from 'react'
import { ComparisonClassDetails } from 'dvc/src/plots/webview/contract'
import cx from 'classnames'
import styles from './styles.module.scss'
import { ComparisonTablePinnedContentRow } from './ComparisonTablePinnedContentRow'
import { toggleComparisonClass } from '../../util/messages'
import Tooltip from '../../../shared/components/tooltip/Tooltip'
import { Button } from '../../../shared/components/button/Button'

export const ComparisonTableRowClasses: React.FC<{
  classDetails: ComparisonClassDetails
  pinnedColumn: string
  nbColumns: number
  cellClasses: string
  path: string
}> = ({ classDetails, pinnedColumn, nbColumns, cellClasses, path }) => {
  const classDetailsArr = Object.entries(classDetails)

  if (classDetailsArr.length === 0) {
    return
  }

  const labelElements = classDetailsArr.map(([label, { color, selected }]) => (
    <label
      key={label}
      className={cx(styles.classButton, selected && styles.classButtonSelected)}
      style={{ '--class-color': color } as React.CSSProperties}
    >
      <input
        type="checkbox"
        name="labels"
        value={label}
        onChange={event =>
          toggleComparisonClass(path, label, event.target.checked)
        }
        checked={selected}
        className={styles.hiddenInput}
      />
      {label}
    </label>
  ))
  const hiddenLabelElements = labelElements.slice(4)

  return (
    <ComparisonTablePinnedContentRow
      pinnedColumn={pinnedColumn}
      nbColumns={nbColumns}
    >
      <div
        data-testid="row-bounding-box-classes"
        className={cx(styles.classes, cellClasses)}
      >
        <p className={styles.classesTitle}>Classes</p>
        <div className={cx(styles.classButtons, styles.tableRowClassButtons)}>
          {labelElements.slice(0, 3)}
        </div>
        {hiddenLabelElements.length > 0 && (
          <Tooltip
            appendTo={document.body}
            content={
              <div
                className={cx(styles.classButtons, styles.tooltipClassButtons)}
              >
                {hiddenLabelElements}
              </div>
            }
            trigger="click"
            interactive
            placement="bottom-start"
          >
            <span className={styles.showMoreButtonWrapper}>
              <Button
                appearance="secondary"
                onClick={() => {}}
                text={`Show more (${hiddenLabelElements.length})`}
              />
            </span>
          </Tooltip>
        )}
      </div>
    </ComparisonTablePinnedContentRow>
  )
}
