import React, { MouseEvent, ReactElement, SVGProps } from 'react'
import styles from './styles.module.scss'
import { Dropdown, DropdownToggle } from '../Dropdown'

export interface MenuItemProps {
  children?: React.ReactNode
  isDisabled?: boolean
  isSelected?: boolean
  id?: string
  actions?: React.ReactNode
  onClick?: (event: React.MouseEvent | React.KeyboardEvent | MouseEvent) => void
}

export interface MenuProps {
  menuItems: React.ReactNode[]
  isOpen: boolean
  toggle: ReactElement
  id: string
}

export interface MenuItemGroupProps {
  children?: React.ReactNode
  id: string
}

export type DragDotProps = SVGProps<SVGSVGElement>

export interface ChevronProps extends SVGProps<SVGSVGElement> {
  open: boolean
}

export const MenuSeparator: React.FC = () => {
  return <li role="separator"></li>
}

export const MenuToggle = DropdownToggle

export const DragDots: React.FC<DragDotProps> = props => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-6 0 25 24"
      width={14}
      {...props}
      className={styles.menu__decorator}
    >
      <rect height="4" width="4" y="4" x="0" />
      <rect height="4" width="4" y="12" x="0" />
      <rect height="4" width="4" y="20" x="0" />
      <rect height="4" width="4" y="4" x="8" />
      <rect height="4" width="4" y="12" x="8" />
      <rect height="4" width="4" y="20" x="8" />
    </svg>
  )
}

export const Chevron: React.FC<ChevronProps> = ({ open, ...rest }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-50 0 356 256"
      transform={open ? 'rotate(90)' : undefined}
      width={17}
      className={styles.menu__decorator}
      {...rest}
    >
      <polygon points="79.093,0 48.907,30.187 146.72,128 48.907,225.813 79.093,256 207.093,128 		" />
    </svg>
  )
}

export const MenuItem: React.FC<MenuItemProps> = ({
  children,
  isDisabled,
  isSelected,
  id,
  actions,
  ...props
}) => {
  return (
    <li id={id} key={`menu-item-li-${id}`} role="menuitem">
      <button
        key={`button-${id}`}
        id={id}
        className={styles.menu__menuItem}
        disabled={isDisabled}
        {...props}
      >
        {children}
        {isSelected && (
          <span className={styles.menu__menuItem__icon}>
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
      {actions && (
        <div className={styles.menu__menuItem__actions}>{actions}</div>
      )}
    </li>
  )
}

export const MenuItemGroup: React.FC<MenuItemGroupProps> = ({
  children,
  id
}) => {
  return (
    <section className={styles.menu__group} id={id}>
      <ul>{children}</ul>
    </section>
  )
}

export const Menu: React.FC<MenuProps> = ({
  menuItems,
  isOpen,
  toggle,
  id
}) => {
  return (
    <Dropdown content={menuItems} isOpen={isOpen} toggle={toggle} id={id} />
  )
}
