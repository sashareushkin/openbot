# Personal macOS builds

Use `bun run package:personal:mac` for the personal fork. Run it from a clean Git worktree, including
untracked files. A clean worktree ties the build to its source commit. The command works from a
separate worktree, but always saves builds in
`/Users/sashareushkin/projects/openbot/sync-v0.52.1/dist/`.

Each build has a directory such as `fork-v0.52.6`. The script finds the highest numbered
`fork-v<major>.<minor>.<number>` directory and adds one to its last number. The directory number is
a build label; it does not change the application version. A build never overwrites an existing
folder. If there is no numbered folder, the script stops so the starting number can be chosen.

The command builds for the current Mac architecture with the fork identity and profile, excludes
source maps, disables signing and notarization, and verifies the package before it is kept. It does
not install an app or change a user profile. Official desktop application updates remain disabled
on macOS.

Each successful build gets a local annotated Git tag named `personal-macos-<UTC timestamp>-<commit>`.
`BUILD-INFO` records its full commit, branch, tag and build directory. The tag identifies source, not
an archive of the app or user data. Do not move or reuse tags. Push the tag and attach a verified
archive to the matching GitHub Release only when publishing is authorized.

After verification, keep the new build and the two previous numbered builds. Older numbered build
directories containing an OpenBot app are removed. A running app is kept until a later build, even
if that temporarily leaves more than three. Failed builds do not remove previous builds. Other files
and folders in `dist` are not removed. Tags and GitHub releases are not removed by this cleanup.
