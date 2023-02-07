import React from 'react'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Button } from '../../shared/components/button/Button'

export const Studio: React.FC = () => {
  return (
    <EmptyState>
      <div>
        <h1>
          Connect to <a href="https://studio.iterative.ai">Studio</a>
        </h1>
        <p>To share experiments with collaborators directly from your IDE.</p>
        <p>
          An{' '}
          <a href="https://dvc.org/doc/studio/user-guide/projects-and-experiments/live-metrics-and-plots#set-up-an-access-token">
            access token
          </a>{' '}
          can be generated from your Studio profile page.
        </p>
        <Button
          appearance="primary"
          isNested={false}
          text={'Sign In'}
          onClick={() => undefined}
        />
        <Button
          appearance="secondary"
          isNested={true}
          text={'Get Token'}
          onClick={() => undefined}
        />
        <Button
          appearance="secondary"
          isNested={true}
          text={'Save'}
          onClick={() => undefined}
        />
        <p>
          {"Don't Have an account?\n"}
          <a href="https://studio.iterative.ai">Sign-Up</a>
        </p>
      </div>
    </EmptyState>
  )
}
