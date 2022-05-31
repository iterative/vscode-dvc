import { Revision } from 'dvc/src/plots/webview/contract'
import React, { useRef, useState, useEffect } from 'react'
import styles from './styles.module.scss'
import { AllIcons, Icon } from '../../../shared/components/Icon'
import Tooltip from '../../../shared/components/tooltip/Tooltip'

interface RibbonBlockProps {
  revision: Revision
  onClear: () => void
}

export enum CopyTooltip {
  NORMAL = 'Copy',
  COPIED = 'Copied'
}

export const RibbonBlock: React.FC<RibbonBlockProps> = ({
  revision,
  onClear
}) => {
  const [copyTooltip, setCopyTooltip] = useState(CopyTooltip.NORMAL)
  const copyTooltipTimeout = useRef(0)

  useEffect(() => {
    return () => {
      clearTimeout(copyTooltipTimeout.current)
    }
  }, [])

  const copyExp = async (exp: string) => {
    try {
      await navigator.clipboard.writeText(exp)
      setCopyTooltip(CopyTooltip.COPIED)
      copyTooltipTimeout.current = window.setTimeout(() => {
        setCopyTooltip(CopyTooltip.NORMAL)
      }, 2000)
    } catch {
      setCopyTooltip(CopyTooltip.NORMAL)
    }
  }
  const exp = revision.group?.replace(/[[\]]/g, '') || revision.revision

  return (
    <li
      className={styles.block}
      style={{ borderColor: revision.displayColor }}
      data-testid={`ribbon-${revision.id}`}
    >
      <Tooltip content={<>{copyTooltip}</>} hideOnClick={false} delay={500}>
        <button className={styles.label} onClick={() => copyExp(exp)}>
          <span>{exp}</span>
          {revision.group && (
            <span className={styles.subtitle}>{revision.revision}</span>
          )}
        </button>
      </Tooltip>
      <Tooltip content="Clear" placement="bottom" delay={500}>
        <button className={styles.clearButton} onClick={onClear}>
          <Icon icon={AllIcons.CLOSE} width={12} height={12} />
        </button>
      </Tooltip>
    </li>
  )
}
