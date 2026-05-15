# Reddit Comments for YouTube (+ Nebula)

[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/jkindjececcjpkladckbgblgblocgoep?style=flat-square&logo=googlechrome&logoColor=white&color=%234285F4)](https://chromewebstore.google.com/detail/linkfxer/jkindjececcjpkladckbgblgblocgoep)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/rcfy?style=flat-square&logo=firefoxbrowser&logoColor=white&color=%23FF7139)
](https://addons.mozilla.org/addon/rcfy/)

An extension to display Reddit (and Lemmy) threads for YouTube and Nebula videos. You can also view threads for any URL through the popup!

This is loosely based on [Lucien Maloney's extension](https://github.com/lucienmaloney/reddit_comments_for_youtube_extension) (it was once a fork, but has since been totally rewritten thrice).

Supports:

- Displaying threads
- Blacklisting communities
- Voting
- Commenting

Interactive elements will be stripped if:

- The extension cannot access Reddit cookies
- The user is logged out
- The user is suspended
- The thread is archived
- The thread or comment chain is locked

## Local Setup

The [wxt](https://wxt.dev/) browser extension framework is used to handle building and browser functions.

### Installation

```sh
# Install dependencies
bun install --frozen-lockfile
```

### Development

This will create a dev server with HMR and fast reload.

```sh
# Chromium
bun run dev

# Firefox
bun run dev:firefox
```

### Building

This will build the extension to a folder in `.output`.

```sh
# Chromium
bun run build

# Firefox
bun run build:firefox
```

### Packaging

This will build and ZIP the extension to `.output`.

```sh
# Chromium
bun run zip

# Firefox
bun run zip:firefox
```

## Gallery

![Screenshot of comments (light mode)](https://files.catbox.moe/isyjop.png)
![Screenshot of thread selector (dark mode)](https://files.catbox.moe/g41iut.png)
![Screenshot of popup](https://files.catbox.moe/bpdjt6.png)

## Licence

Reddit Comments for YouTube

Copyright (C) 2026 thea

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

```
SPDX-License-Identifier: AGPL-3.0-or-later
```
