import cx from 'classnames'
import React, { PropsWithChildren, ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import styles from '../styles.module.scss'

interface WorkspaceRowGroupProps {
  root: HTMLElement | null
  tableHeaderHeight: number
  children: ReactNode
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
