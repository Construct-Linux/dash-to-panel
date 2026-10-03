# Dash to Panel for CONSTRUCT

This is [CONSTRUCT](https://github.com/Construct-Linux)'s fork of
[Dash to Panel](https://github.com/home-sweet-gnome/dash-to-panel), the GNOME
Shell extension that turns the dash into a taskbar panel. The `gnome-51` branch
follows upstream `master` and runs on GNOME Shell 51 only: the code paths for
older shells are removed.

## Changes from upstream

- A drag that crosses the panel (a browser tab, a text selection, a file) no
  longer opens the overview; dropping onto a taskbar icon still raises that
  app's window. (upstream #2087, #2407)
- The intellihide shortcut (`<Super>i`) is grabbed only while intellihide is
  enabled, so other applications receive it otherwise. (#2416)
- The long press inherited from GNOME Shell's AppIcon opens the icon menu for
  touch only; a slightly long left click activates the app again. (#2561)
- A notification badge clears even when the update arrives after the app's last
  window is gone. (#2560)
- `panelManager.js` and `stripe.png` lost their executable bit. (#2433)
- No "Dash to Panel has been updated" notification: the image updates the
  extension, and enabling it writes no version key.
- Escape in the overview, opened from the show-apps button, returns to the
  desktop again: GNOME Shell 51 delivers the key through its stage
  `KeyController`, not an event.
- GNOME Shell 51 only: version checks, feature probes and fallbacks for older
  shells are gone, as are upstream's CI, design media, donation images, Node
  lint tooling and the extensions.gnome.org zip target.

## Installation

CONSTRUCT builds it with the `gnome-shell-extension-dash-to-panel` recipe in
[CONSTRUCT's build repository](https://github.com/Construct-Linux/os), which runs:

    make install DESTDIR=<destdir> VERSION=<version>

With `DESTDIR`, the extension goes to
`/usr/share/gnome-shell/extensions/dash-to-panel@jderose9.github.com`, the
GSettings schema to `/usr/share/glib-2.0/schemas` (compiled with the image) and
the translations to `/usr/share/locale`. Without `DESTDIR`, `make install`
installs into `~/.local/share/gnome-shell/extensions` with a compiled schema.
Building needs `make`, `glib-compile-schemas` and `msgfmt`. `make potfile` and
`make mergepo` refresh the translation template and catalogs.

## Credits

Dash to Panel is developed and maintained by
[@jderose9](https://github.com/jderose9) and
[@charlesg99](https://github.com/charlesg99), with many contributors and
translators listed in the
[upstream README](https://github.com/home-sweet-gnome/dash-to-panel#credits).
It builds on [ZorinOS Taskbar](https://github.com/ZorinOS/zorin-taskbar),
[Dash to Dock](https://micheleg.github.io/dash-to-dock/),
[bottompanel](https://github.com/Thoma5/gnome-shell-extension-bottompanel),
[Frippery Move Clock](http://frippery.org/extensions/) and
[StatusAreaHorizontalSpacing](https://bitbucket.org/mathematicalcoffee/status-area-horizontal-spacing-gnome-shell-extension).

## License

GPL-2.0-or-later; see [`COPYING`](COPYING).
