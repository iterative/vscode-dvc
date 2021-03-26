import React, { HTMLAttributes } from 'react'
import styles from './styles.module.scss'
import { useCloseActiveHook } from '../../util/useCloseActiveHook'
import cn from 'classnames'

export interface DropdownToggleProps extends HTMLAttributes<HTMLButtonElement> {
  onToggle?: (isOpen: boolean) => void
  isOpen?: boolean
  toggleTemplate?: React.ReactNode
}

export interface DropdownProps {
  content: React.ReactNode
  isOpen: boolean
  toggle: React.ReactElement
  id: string
}

export const DropdownToggle: React.FC<DropdownToggleProps> = ({
  isOpen,
  onToggle,
  toggleTemplate,
  className,
  ...rest
}) => {
  return (
    <button
      onClick={() => {
        onToggle?.(!isOpen)
      }}
      className={cn(styles.dropdown__toggle, className)}
      {...rest}
    >
      <span className={styles.dropdown__toggle__text}>{toggleTemplate}</span>
      <span className={styles.dropdown__toggle__icon}>
        <svg
          fill="currentColor"
          height="1em"
          width="1em"
          viewBox="0 0 320 512"
          aria-hidden="true"
          role="img"
          style={{ verticalAlign: -0.125 + 'em' }}
        >
          <path d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"></path>
        </svg>
      </span>
    </button>
  )
}

export const Dropdown: React.FC<DropdownProps> = ({
  content,
  isOpen,
  toggle,
  id
}) => {
  const ContentRef = React.useRef(null)
  const [isActive, setIsActive] = useCloseActiveHook(ContentRef, false)

  const onClick = () => setIsActive(!isActive)

  return (
    <div className={styles.dropdown} id={id}>
      {React.cloneElement(toggle, {
        isOpen,
        onToggle: onClick // this passes the current toggle status to MenuToggle component
      })}
      <div
        ref={ContentRef}
        className={`${styles.dropdown__container} ${
          !isActive && !isOpen ? styles.dropdown__container__inactive : ''
        }`}
        role="menu"
      >
        {content}
      </div>
    </div>
  )
}
