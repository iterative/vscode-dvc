## Feedback

See something that should be changed? Want to request a new feature? Open an
[issue on GitHub](https://github.com/iterative/vscode-dvc/issues)!

## Pull requests

You may also submit a change request to this repository directly
[from here](https://github.com/iterative/vscode-dvc/pulls). Contributions are
highly appreciated!

> 💡 **Tip**: To enable formatting on save in VS Code, install the
> `esbenp.prettier-vscode` extension. This is highly recommended as PRs with
> improper format will be blocked from merge until fixed.

## Development environment

The development environment allows contributors to test their changes to the
extension. The local repository source is built and loaded into the Extension
Development Host.

First, ensure that [Yarn](https://yarnpkg.com/) and
[Visual Studio Code](https://code.visualstudio.com) are installed.

- Open this repository's root directory as a project in VS Code.

- Run `Tasks: Run Build Task` (Ctrl+Shift+b) to start the extension and webview
  development servers (alternatively run `yarn dev-server` from the terminal).

  > **Warning**: Having a separate (`.vsix`) version of the extension installed
  > may cause all kinds of chaos in your development environment.

- Open the Extension Development Host, a child instance of VS Code with the
  results of the dev servers installed as an extension, with `Start Debugging`
  (f5).

  > **Note**: using the `Run Extension` command when running the debugger will
  > prevent all other extensions from loading into VS Code. This will improve
  > the performance of VS Code but can cause certain DVC commands to fail if the
  > project uses an isolated python environment (see [this warning](#warning)).

- Open a DVC project in the Extension Development Host. VS Code will remember
  the last project opened, so this step only has to be done once.

  > **Note**: We have provided a demo project as part of this repo, but feel
  > free to use any DVC project that you have available.

<a id='warning'></a>

> **Warning**  
> When using any project that relies on an isolated Python environment (`conda`,
> `venv`, etc.), Microsoft's
> [Python extension](https://github.com/Microsoft/vscode-python) is required.
> It's used by this extension to locate and utilize the required environment.

## The demo project

The demo project was initially forked from
[dvc-checkpoints-mnist](https://github.com/iterative/dvc-checkpoints-mnist/tree/make_checkpoint),
and is provided as a lightweight, convenient testbed to try the extension out
with. It is not an exhaustive showcase of DVC's features, so testers are
encouraged to try other DVC repositories- especially real-world cases!

- It is recommended that you create the project's virtual environment with
  Python 3.8 as some dependencies are not yet available for Python 3.9

- `yarn install` is a prerequisite for automatically setting up the demo
  project.

- Run `yarn setup:venv` from the monorepo root (not `./demo`) to automatically
  setup the Python virtual environment in the demo project.

- Once the environment has been setup you should navigate into the demo folder
  activate the virtual environment and run `dvc pull`.

- In order to run experiments in our demo project we require the Python virtual
  environment to be loaded.

- This will happen automatically IF the `ms-python.python` extension is
  installed within the VS Code instance that you are developing against.

## React component development with Storybook

Start Storybook with `yarn storybook` in either the monorepo root or the
`webview` project, and you can develop the React components this plugin uses
without requiring VS Code as a dev environment.

There are some discrepancies between the Storybook environment and the
environment of a real VS Code extension, custom themes being one big one. Always
make sure to try out changed components in the full dev environment before
merging!
