import type { StoryFn, Meta } from '@storybook/react'
import React from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { WebviewWrapper } from '../shared/components/webviewWrapper/WebviewWrapper'
import {
  ContextMenu,
  ContextMenuProps
} from '../shared/components/contextMenu/ContextMenu'
import { Icon } from '../shared/components/Icon'
import { MessagesMenu } from '../shared/components/messagesMenu/MessagesMenu'
import { Lines } from '../shared/components/icons'

export default {
  args: {},
  component: ContextMenu,
  parameters: DISABLE_CHROMATIC_SNAPSHOTS,
  title: 'Context Menu'
} as Meta

const Template: StoryFn<ContextMenuProps> = () => {
  return (
    <WebviewWrapper>
      <ContextMenu
        content={
          <MessagesMenu
            hideOnClick={() => {}}
            options={[
              {
                id: 'apply-to-workspace',
                label: 'Apply to Workspace',
                message: {
                  payload: 'column-id',
                  type: MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE
                }
              }
            ]}
          />
        }
        setHideOnClick={() => {}}
      >
        <div>
          <Icon width={15} icon={Lines} />
        </div>
      </ContextMenu>
    </WebviewWrapper>
  )
}

export const WithOptions = Template.bind({})
