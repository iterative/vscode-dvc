import React from 'react'
import menuStyles from './SortMenu.scss'
import { useOutsideClickHook } from '../../util/useOutsideClickHook'

export interface SortMenuToggleProps {
  onToggle?: (isOpen: boolean) => void
  isOpen?: boolean
  toggleTemplate?: React.ReactNode
  id: string
}

export interface SortMenuItemProps {
  children?: React.ReactNode
  isSelected?: boolean
  isDisabled?: boolean
  onSelect?: (
    event?: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent,
    value?: any
  ) => void
  id?: string
}

export interface SortMenuProps {
  menuItems: React.ReactNode[]
  isOpen: boolean
  toggle: React.ReactElement
  id: string
}

export interface SortMenuItemGroupProps {
  children?: React.ReactNode
  id: string
}

export const SortMenuSeparator: React.FC = () => {
  return <li role="separator"></li>
}

export const SortMenuToggle: React.FC<SortMenuToggleProps> = ({
  isOpen,
  onToggle,
  id,
  toggleTemplate
}) => {
  return (
    <button
      onClick={() => onToggle && onToggle(!isOpen)}
      className={menuStyles.sortMenu__toggle}
      id={id}
    >
      <span className={menuStyles.sortMenu__toggle__text}>
        {toggleTemplate}
      </span>
      <span className={menuStyles.sortMenu__toggle__icon}>
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

export const SortMenuItem: React.FC<SortMenuItemProps> = ({
  children,
  isSelected,
  isDisabled,
  onSelect,
  id
}) => {
  return (
    <li id={id} key={id} role="menuitem">
      <button
        key={`button-${id}`}
        className={menuStyles.sortMenu__menuItem}
        onClick={event => {
          onSelect && onSelect(event, children)
        }}
        disabled={isDisabled}
      >
        {children}
        {isSelected && (
          <span className={menuStyles.sortMenu__menuItem__icon}>
            <svg
              fill="currentColor"
              height="1em"
              width="1em"
              viewBox="0 0 512 512"
              aria-hidden="true"
              role="img"
              style={{ verticalAlign: -0.125 + 'em' }}
            >
              <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
            </svg>
          </span>
        )}
      </button>
    </li>
  )
}

export const SortMenuItemGroup: React.FC<SortMenuItemGroupProps> = ({
  children,
  id
}) => {
  return (
    <section className={menuStyles.sortMenu__group} id={id}>
      <ul>{children}</ul>
    </section>
  )
}

export const SortMenu: React.FC<SortMenuProps> = ({
  menuItems,
  isOpen,
  toggle,
  id
}) => {
  const sortMenuRef = React.useRef(null)
  let renderedMenuItems
  let onClick
  const [isActive, setIsActive] = useOutsideClickHook(sortMenuRef, false)

  if (menuItems && menuItems.length) {
    renderedMenuItems = menuItems
  }

  // we need to add this check to determine if setIsActive is a function or not othherwise we'll get type compatible call signature error.
  if (typeof setIsActive === 'function' && !(setIsActive instanceof Array)) {
    onClick = () => setIsActive(!isActive)
  }

  return (
    <div className={menuStyles.sortMenu} id={id}>
      {React.cloneElement(toggle, {
        isOpen,
        onToggle: onClick // this passes the current toggle status to SortToggle component
      })}
      <div
        ref={sortMenuRef}
        className={`${menuStyles.sortMenu__menu} ${
          !isActive && !isOpen ? menuStyles.sortMenu__menu__inactive : ''
        }`}
        role="menu"
      >
        {renderedMenuItems}
      </div>
    </div>
  )
}
