import cx from 'classnames'
import React, { useEffect, useState } from 'react'
import {
  PlotSize,
  Section,
  SectionCollapsed
} from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { PlotsPicker, PlotsPickerProps } from './PlotsPicker'
import { SizePicker } from './SizePicker'
import styles from './styles.module.scss'
import { SectionRenamer } from './SectionRenamer'
import { AllIcons, Icon } from '../../shared/components/Icon'
import { IconMenu } from '../../shared/components/iconMenu/IconMenu'
import { IconMenuItemProps } from '../../shared/components/iconMenu/IconMenuItem'
import { sendMessage } from '../../shared/vscode'

export interface PlotsContainerProps {
  sectionCollapsed: SectionCollapsed
  sectionKey: Section
  title: string
  onRename: (section: Section, name: string) => void
  onResize: (size: PlotSize, section: Section) => void
  currentSize: PlotSize
  menu?: PlotsPickerProps
}

export type BasicContainerProps = Pick<
  PlotsContainerProps,
  'onRename' | 'onResize' | 'sectionCollapsed'
>

export const PlotsContainer: React.FC<PlotsContainerProps> = ({
  sectionCollapsed,
  sectionKey,
  title,
  children,
  onRename,
  onResize,
  currentSize,
  menu
}) => {
  const [isRenaming, setIsRenaming] = useState(false)
  const [sectionTitle, setSectionTitle] = useState(title)
  const [size, setSize] = useState<PlotSize>(currentSize)

  const open = !sectionCollapsed[sectionKey]

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [size])

  const sizeClass = cx({
    [styles.plotsWrapper]: sectionKey !== Section.COMPARISON_TABLE,
    [styles.smallPlots]: size === PlotSize.SMALL,
    [styles.regularPlots]: size === PlotSize.REGULAR,
    [styles.largePlots]: size === PlotSize.LARGE
  })

  const menuItems: IconMenuItemProps[] = [
    {
      icon: AllIcons.PENCIL,
      onClick: () => setIsRenaming(true),
      tooltip: 'Rename'
    }
  ]

  const changeSize = (newSize: PlotSize) => {
    if (size === newSize) {
      return
    }
    onResize(newSize, sectionKey)
    setSize(newSize)
  }

  if (menu) {
    menuItems.push({
      icon: AllIcons.LINES,
      onClickNode: <PlotsPicker {...menu} />,
      tooltip: 'Choose metrics'
    })
  }

  menuItems.push({
    icon: AllIcons.DOTS,
    onClickNode: <SizePicker currentSize={size} setSelectedSize={changeSize} />,
    tooltip: 'Resize'
  })

  const onTitleChanged = (title: string) => {
    setIsRenaming(false)
    setSectionTitle(title)
    onRename(sectionKey, title)
  }

  return (
    <div className={styles.plotsContainerWrapper}>
      <details open={open} className={styles.plotsContainer}>
        <summary
          onClick={e => {
            e.preventDefault()
            sendMessage({
              payload: {
                [sectionKey]: !sectionCollapsed[sectionKey]
              },
              type: MessageFromWebviewType.PLOTS_SECTION_TOGGLED
            })
          }}
        >
          <Icon
            icon={open ? AllIcons.CHEVRON_DOWN : AllIcons.CHEVRON_RIGHT}
            data-testid="plots-container-details-chevron"
            width={20}
            height={20}
            className={styles.detailsIcon}
          />

          {isRenaming ? (
            <SectionRenamer
              defaultTitle={sectionTitle}
              onChangeTitle={onTitleChanged}
            />
          ) : (
            sectionTitle
          )}
        </summary>
        <div className={styles.centered}>
          {open && (
            <div className={sizeClass} data-testid="plots-wrapper">
              {children}
            </div>
          )}
        </div>
      </details>
      <div className={styles.iconMenu}>
        <IconMenu items={menuItems} />
      </div>
    </div>
  )
}
