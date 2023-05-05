import cx from 'classnames'
import React, { MouseEvent, ReactNode } from 'react'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { STUDIO_URL, SetupSection } from 'dvc/src/setup/webview/contract'
import styles from './styles.module.scss'
import { Icon } from '../Icon'
import { ChevronDown, ChevronRight, Info } from '../icons'
import { isSelecting } from '../../../util/strings'
import { isTooltip } from '../../../util/helpers'
import Tooltip from '../tooltip/Tooltip'
import { IconMenu } from '../iconMenu/IconMenu'
import { IconMenuItemProps } from '../iconMenu/IconMenuItem'

export const SectionDescription = {
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
  ),
  // Setup DVC
  [SetupSection.DVC]: (
    <span data-testid="tooltip-setup-dvc">
      Configure the extension to start working with DVC.
    </span>
  ),
  // Setup Experiments
  [SetupSection.EXPERIMENTS]: (
    <span data-testid="tooltip-setup-experiments">
      Configure the extension to start tracking and visualizing{' '}
      <a href="https://dvc.org/doc/start/experiment-management/experiments">
        experiments
      </a>
      .
    </span>
  ),
  // Setup Studio
  [SetupSection.STUDIO]: (
    <span data-testid="tooltip-setup-studio">
      {"Configure the extension's connection to "}
      <a href={STUDIO_URL}>Studio</a>.<br />
      Studio provides a collaboration platform for Machine Learning and is free
      for small teams and individual contributors.
    </span>
  )
} as const

interface SectionContainerProps<T extends PlotsSection | SetupSection> {
  children: ReactNode
  menuItems?: IconMenuItemProps[]
  headerChildren?: ReactNode
  onToggleSection: () => void
  sectionCollapsed: boolean
  sectionKey: T
  title: string
  className?: string
  stickyHeaderTop?: number
}

const InfoIcon = () => (
  <Icon icon={Info} width={16} height={16} className={styles.infoIcon} />
)

export const SectionContainer: React.FC<
  SectionContainerProps<PlotsSection | SetupSection>
> = ({
  children,
  menuItems = [],
  onToggleSection,
  sectionCollapsed,
  sectionKey,
  title,
  className,
  stickyHeaderTop = 0,
  headerChildren
}) => {
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
      onToggleSection()
    }
  }

  return (
    <div
      className={cx(styles.sectionContainerWrapper, className)}
      data-testid="section-container"
    >
      <details open={open} className={styles.sectionContainer}>
        <summary onClick={toggleSection} style={{ top: stickyHeaderTop }}>
          <div className={styles.summaryTitle}>
            <Icon
              icon={open ? ChevronDown : ChevronRight}
              data-testid="section-container-details-chevron"
              width={20}
              height={20}
              className={styles.detailsIcon}
            />
            {title}
            <Tooltip
              content={tooltipContent}
              placement="bottom-end"
              interactive
              appendTo={document.body}
            >
              <div
                className={styles.infoTooltipToggle}
                data-testid="info-tooltip-toggle"
              >
                <InfoIcon />
              </div>
            </Tooltip>
          </div>

          {headerChildren}

          {menuItems.length > 0 && (
            <div className={styles.iconMenu}>
              <IconMenu items={menuItems} />
            </div>
          )}
        </summary>
        <div className={styles.insideSection}>{children}</div>
      </details>
    </div>
  )
}
