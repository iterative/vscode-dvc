import React, { MouseEvent } from 'react'
import { Section as PlotsSection } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import { Icon } from '../Icon'
import { ChevronDown, ChevronRight, Info } from '../icons'
import { isSelecting } from '../../../util/strings'
import { isTooltip } from '../../../util/helpers'
import { sendMessage } from '../../vscode'
import Tooltip from '../tooltip/Tooltip'
import { IconMenu } from '../iconMenu/IconMenu'
import { IconMenuItemProps } from '../iconMenu/IconMenuItem'

export const SectionDescription = {
  // "Trends"
  [PlotsSection.CHECKPOINT_PLOTS]: (
    <span data-testid="tooltip-checkpoint-plots">
      Automatically generated and updated linear plots that show metric value
      per epoch if{' '}
      <a href="https://dvc.org/doc/user-guide/experiment-management/checkpoints">
        checkpoints
      </a>{' '}
      are enabled.
    </span>
  ),
  // "Custom"
  [PlotsSection.CUSTOM_PLOTS]: (
    <span data-testid="tooltip-custom-plots">
      Generated custom linear plots comparing chosen metrics and params in all
      experiments in the table.
    </span>
  ),
  // "Images"
  [PlotsSection.COMPARISON_TABLE]: (
    <span data-testid="tooltip-comparison-plots">
      Images (e.g. any <code>.jpg</code>, <code>.svg</code>, or
      <code>.png</code> file) rendered side by side across experiments. They
      should be registered as{' '}
      <a href="https://dvc.org/doc/user-guide/experiment-management/visualizing-plots">
        plots
      </a>
      .
    </span>
  ),
  // "Data Series"
  [PlotsSection.TEMPLATE_PLOTS]: (
    <span data-testid="tooltip-template-plots">
      Any <code>JSON</code>, <code>YAML</code>, <code>CSV</code>, or{' '}
      <code>TSV</code> file(s) with data points, visualized using{' '}
      <a href="https://dvc.org/doc/user-guide/experiment-management/visualizing-plots#plot-templates-data-series-only">
        plot templates
      </a>
      . Either predefined (e.g. confusion matrix, linear) or{' '}
      <a href="https://dvc.org/doc/command-reference/plots/templates#custom-templates">
        custom Vega-lite templates
      </a>
      .
    </span>
  )
} as const

export interface SectionContainerProps<T extends PlotsSection> {
  sectionCollapsed: boolean
  sectionKey: T
  title: string
  children: React.ReactNode
  menuItems: IconMenuItemProps[]
}

const InfoIcon = () => (
  <Icon icon={Info} width={16} height={16} className={styles.infoIcon} />
)

export const SectionContainer: React.FC<
  SectionContainerProps<PlotsSection>
> = ({ sectionCollapsed, sectionKey, title, children, menuItems }) => {
  const open = !sectionCollapsed

  const tooltipContent = (
    <div className={styles.infoTooltip}>
      <InfoIcon />
      {SectionDescription[sectionKey]}
    </div>
  )

  const toggleSection = (e: MouseEvent) => {
    e.preventDefault()
    if (
      !isSelecting([title, SectionDescription[sectionKey].props.children]) &&
      !isTooltip(e.target as Element, ['SUMMARY', 'BODY'])
    ) {
      sendMessage({
        payload: {
          [sectionKey]: !sectionCollapsed
        },
        type: MessageFromWebviewType.TOGGLE_SECTION
      })
    }
  }

  return (
    <div
      className={styles.sectionContainerWrapper}
      data-testid="section-container"
    >
      <details open={open} className={styles.sectionContainer}>
        <summary onClick={toggleSection}>
          <Icon
            icon={open ? ChevronDown : ChevronRight}
            data-testid="section-container-details-chevron"
            width={20}
            height={20}
            className={styles.detailsIcon}
          />
          {title}
          <Tooltip content={tooltipContent} placement="bottom-end" interactive>
            <div
              className={styles.infoTooltipToggle}
              data-testid="info-tooltip-toggle"
            >
              <InfoIcon />
            </div>
          </Tooltip>
        </summary>
        {children}
      </details>
      {menuItems.length > 0 && (
        <div className={styles.iconMenu}>
          <IconMenu items={menuItems} />
        </div>
      )}
    </div>
  )
}
