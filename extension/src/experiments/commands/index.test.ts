describe('fun', () => {
  it('should convert the link in the stdout to a link', () => {
    const stdout = `Experiment major-lamb is up to date on Git remote 'origin'.
View your experiments at 
https://studio.iterative.ai/user/mattseddon/projects/vscode-dvc-demo-ynm6t3jxdx`

    expect(
      stdout.replace(
        /\sat\s+https:\/\/studio\.iterative\.ai\/.*$/,
        ' in [Studio](https://studio.iterative.ai/user/mattseddon/projects/vscode-dvc-demo-ynm6t3jxdx)'
      )
    ).toStrictEqual(`Experiment major-lamb is up to date on Git remote 'origin'.
View your experiments in [Studio](https://studio.iterative.ai/user/mattseddon/projects/vscode-dvc-demo-ynm6t3jxdx)`)
  })

  it('should capture the url', () => {
    const rx = /\sat\s+(https:\/\/studio\.iterative\.ai\/.*$)/

    const stdout = `Experiment major-lamb is up to date on Git remote 'origin'.
View your experiments at 
https://studio.iterative.ai/user/mattseddon/projects/vscode-dvc-demo-ynm6t3jxdx`

    const match = stdout.match(rx)
    expect(match?.[1]).toStrictEqual(
      'https://studio.iterative.ai/user/mattseddon/projects/vscode-dvc-demo-ynm6t3jxdx'
    )

    expect(
      stdout.replace(
        match?.[0] as string,
        ` in [Studio](${match?.[1] as string})`
      )
    ).toStrictEqual(`Experiment major-lamb is up to date on Git remote 'origin'.
View your experiments in [Studio](https://studio.iterative.ai/user/mattseddon/projects/vscode-dvc-demo-ynm6t3jxdx)`)
  })
})
