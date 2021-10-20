# Output channel

All commands which are run against the DVC CLI are logged into this extension's
dedicated output channel.

The channel will have two entries for each command that runs.

The first shows the command has started and the second is to signify that it has
completed.

The completion entry will show:

- The outcome of the command (COMPLETED / FAILED).
- Any non-zero exit codes.
- The length of time that each command took to run (ms).
- Any error message provided by the CLI.
