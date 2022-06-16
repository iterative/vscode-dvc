import React, { MouseEventHandler, ReactNode } from 'react'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import cx from 'classnames'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { FilteredCounts } from 'dvc/src/experiments/model/filterBy/collect'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import SvgSortPrecedence from '../../../shared/components/icons/SortPrecedence'
import SvgFilter from '../../../shared/components/icons/Filter'
import { sendMessage } from '../../../shared/vscode'
import Tooltip from '../../../shared/components/tooltip/Tooltip'
import tooltipStyles from '../../../shared/components/tooltip/styles.module.scss'

const Indicator = ({
  children,
  count,
  'aria-label': ariaLabel,
  tooltipContent,
  onClick
}: {
  children: ReactNode
  count?: number
  'aria-label'?: string
  onClick?: MouseEventHandler
  tooltipContent: ReactNode
}) => (
  <Tooltip
    placement="bottom-start"
    content={tooltipContent}
    className={tooltipStyles.padded}
  >
    <button
      className={cx(styles.indicatorIcon, count && styles.indicatorWithCount)}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
      {count ? <span className={styles.indicatorCount}>{count}</span> : null}
    </button>
  </Tooltip>
)

const focusFiltersTree = () =>
  sendMessage({ type: MessageFromWebviewType.FOCUS_FILTERS_TREE })
const focusSortsTree = () =>
  sendMessage({ type: MessageFromWebviewType.FOCUS_SORTS_TREE })

const pluralize = (word: string, number: number | undefined) =>
  number === 1 ? word : `${word}s`

const formatCountMessage = (item: string, count: number | undefined) =>
  `${count || 'No'} ${pluralize(item, count)} applied`

const formatFilteredCountMessage = (item: string, filteredCount: number) =>
  `${filteredCount || 'No'} ${pluralize(item, filteredCount)} filtered`

export const Indicators = ({
  sorts,
  filters,
  filteredCounts
}: {
  sorts?: SortDefinition[]
  filters?: string[]
  filteredCounts: FilteredCounts
}) => {
  const sortsCount = sorts?.length
  const filtersCount = filters?.length
  return (
    <div className={styles.tableIndicators}>
      <Indicator
        count={sorts?.length}
        aria-label="sorts"
        onClick={focusSortsTree}
        tooltipContent={formatCountMessage('sort', sortsCount)}
      >
        <Icon width={16} height={16} icon={SvgSortPrecedence} />
      </Indicator>
      <Indicator
        count={filters?.length}
        aria-label="filters"
        onClick={focusFiltersTree}
        tooltipContent={
          <>
            <div>{formatCountMessage('filter', filtersCount)}</div>
            {filtersCount ? (
              <>
                {filteredCounts.experiments !== undefined ? (
                  <div>
                    {formatFilteredCountMessage(
                      'experiment',
                      filteredCounts.experiments
                    )}
                  </div>
                ) : null}
                {filteredCounts.checkpoints !== undefined ? (
                  <div>
                    {formatFilteredCountMessage(
                      'checkpoint',
                      filteredCounts.checkpoints
                    )}
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        }
      >
        <Icon width={16} height={16} icon={SvgFilter} />
      </Indicator>
    </div>
  )
}
