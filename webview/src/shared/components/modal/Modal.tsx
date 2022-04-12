import React, {useEffect} from 'react'
import { AllIcons, Icon } from '../Icon'
import styles from './styles.module.scss'

interface ModalProps {
  onClose: () => void
  onOpen?: () => void
}

export const Modal: React.FC<ModalProps> = ({onClose, onOpen, children}) => {
  useEffect(() => {
    onOpen?.()
  }, [])

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal}>
        <button onClick={onClose}>
          <Icon icon={AllIcons.CLOSE} />
        </button>
        <div className='content'>
          {children}
        </div>
      </div>
    </div>
  )
}
