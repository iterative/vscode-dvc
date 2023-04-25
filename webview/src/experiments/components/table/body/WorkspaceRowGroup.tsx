import cx from 'classnames'
import React, { PropsWithChildren } from 'react'
import { useInView } from 'react-intersection-observer'
import { InstanceProp } from '../../../util/interfaces'
import styles from '../styles.module.scss'

interface WorkspaceRowGroupProps extends InstanceProp {
  root: HTMLElement | null
  tableHeaderHeight: number
}

export const WorkspaceRowGroup: React.FC<
  PropsWithChildren<WorkspaceRowGroupProps>
> = ({ children, root, tableHeaderHeight }) => {
  const [ref, needsShadow] = useInView({
    root,
    rootMargin: `-${tableHeaderHeight + 15}px 0px 0px 0px`,
    threshold: 1
  })

  return (
    <tbody
      ref={ref}
      className={cx(styles.workspaceRowGroup, needsShadow && styles.withShadow)}
    >
      {children}
    </tbody>
  )
}
