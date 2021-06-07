# Feedback

See something that should be changed? Want to request a new feature? Open
[a GitHub Issue!](https://github.com/iterative/vscode-dvc/issues)

# Development Setup

Ensure [Yarn](https://yarnpkg.com/), [DVC](https://dvc.org/doc/install), and
[Visual Studio Code](https://code.visualstudio.com) are installed.

## Development Environment

The development environment allows contributors to test out the extension that
the current repository source will build into by using the Extension Development
Host to load the source as an Extension. Using this, it isn't necessary to build
and install a `.vsix` to test any particular branch or commit of this project.

There are two different ways to spin up a development environment: using an
instance of Visual Studio Code or using the shell. Which one a contributor uses
is up to individual preference, though the VS Code method has some extra
features that the shell method can't replicate.

### VS Code Development Environment

This option is generally best for developers using VS Code as an editor to
develop this extension. It also uniquely has access to the VS Code debugger and
the ability to run the extension with VS Code Stable edition.

- Open the monorepo root as a project in VS Code

- Run `Tasks: Run Build Task` (Ctrl+Shift+b) to start the extension and webview
  development servers (alternatively run `yarn dev-server` from the terminal).

- Open the Extension Development Host, a child instance of VS Code with the
  results of the dev servers installed as an extension, with `Start Debugging`
  (f5).  
  Note: selecting the `Run Extension (Hot Reload + Dev UI for dev-server)`
  option when running the debugger will prevent all other extensions from being
  loaded into the VS code instance. This will improve the performance of VS code
  but cause certain DVC commands to fail.

- Open the demo or another DVC project in the Extension Development Host; VS
  Code will remember the last project opened, so this step only has to be done
  once.

- To enable formatting on save, install the `esbenp.prettier-vscode` extension.
  Optional, but highly recommended as PRs with improper format will be blocked
  from merge until the issue is fixed.

### Shell-based Development Environment

This option lacks access to the debugger, but uses less resources if using an
editor other then VS Code to work on this project. These scripts also assume
`code` is installed and accessible on `$PATH` (i.e. it can be run on the command
line).

- run `yarn dev-server` to start the extension and webview dev servers
  (alternatively, use `extension-dev-server` and `webview-dev-server` to launch
  them individually).

- run `yarn dev-ui` to launch the Extension Development Host.

- Open the demo or another DVC project in the Extension Development Host.
  Alternatively, run `yarn dev-ui demo` to open the demo project directly, or
  replace `demo` with path to the project directory of your choice. VS Code will
  remember the last project opened, so this step only has to be done once.

- Use the "Toggle Developer Tools" command in the Extension Development Host's
  Command Palette to see any console output from the extension, as it won't be
  in the shell.

## The demo project

The demo project was initially forked from
[dvc-checkpoints-mnist](https://github.com/iterative/dvc-checkpoints-mnist/tree/make_checkpoint),
and is provided as a lightweight, convenient testbed to try the extension out
with. It is not an exhaustive showcase of DVC's features, so testers are
encouraged to try other DVC repositories- especially real-world cases!

- It is recommended that you create the project's virtual environment with
  Python 3.8 as some dependencies are not yet available for Python 3.9

- Run `yarn setup:venv` from the monorepo root to automatically setup the Python
  virtual environment in the demo project

- Once the environment has been setup you should navigate into the demo folder
  activate the virtual environment and run `dvc pull`.

- In order to run experiments in our demo project we require the Python virtual
  environment to be loaded.

- This will happen automatically IF the `ms-python.python` extension is
  installed within the VS code instance that you are developing against.

## React Component Development with Storybook

Start Storybook with `yarn storybook` in either the monorepo root or the
`webview` project, and you can develop the React components this plugin uses
without requiring VS Code as a dev environment.

There are some discrepancies between the Storybook environment and the
environment of a real VSCode extension, custom themes being one big one. Always
make sure to try out changed components in the full dev environment before
merging!

# Resources

Check out the
[Resources page](https://github.com/iterative/vscode-dvc/wiki/Resources) of our
GitHub wiki for a list of relevant docs and related projects.
