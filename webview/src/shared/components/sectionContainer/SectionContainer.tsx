import cx from 'classnames'
import React, { MouseEvent, ReactNode } from 'react'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { SetupSection } from 'dvc/src/setup/webview/contract'
import styles from './styles.module.scss'
import { SectionDescriptionMainText } from './SectionDescription'
import { InfoTooltip, TooltipIconType } from './InfoTooltip'
import { Icon } from '../Icon'
import { ChevronDown, ChevronRight } from '../icons'
import { isSelecting } from '../../../util/strings'
import { isTooltip } from '../../../util/helpers'
import { IconMenu } from '../iconMenu/IconMenu'
import { IconMenuItemProps } from '../iconMenu/IconMenuItem'

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
  icon?: TooltipIconType
  secondaryTooltipText?: JSX.Element
}

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
  headerChildren,
  icon,
  secondaryTooltipText
}) => {
  const open = !sectionCollapsed

  const sectionDescription = SectionDescriptionMainText[sectionKey]
  const tooltipTexts = [title, sectionDescription.props.children]

  if (secondaryTooltipText) {
    tooltipTexts.push(secondaryTooltipText.props.children)
  }

  const toggleSection = (e: MouseEvent) => {
    e.preventDefault()
    if (
      /* add extra element text here */
      !isSelecting(tooltipTexts) &&
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
      <details
        data-testid={`${sectionKey}-section-details`}
        open={open}
        className={styles.sectionContainer}
      >
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
            <InfoTooltip icon={icon} sectionKey={sectionKey}>
              {secondaryTooltipText}
            </InfoTooltip>
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
