/*
 * Dash-To-Panel extension for Gnome 3
 * Copyright 2016 Jason DeRose (jderose9) and Charles Gagnon (charlesg99)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import Gio from 'gi://Gio'
import Shell from 'gi://Shell'

import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import { EventEmitter } from 'resource:///org/gnome/shell/misc/signals.js'
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import * as PanelSettings from './panelSettings.js'

import * as PanelManager from './panelManager.js'
import * as AppIcons from './appIcons.js'
import * as Utils from './utils.js'

let panelManager
let startupCompleteHandler

export let DTP_EXTENSION = null
export let SETTINGS = null
export let SETTINGS_CACHE = null
export let DESKTOPSETTINGS = null
export let TERMINALSETTINGS = null
export let NOTIFICATIONSSETTINGS = null
export let PERSISTENTSTORAGE = null
export let EXTENSION_PATH = null
export let tracker = null

export default class DashToPanelExtension extends Extension {
  constructor(metadata) {
    super(metadata)

    this._realHasOverview = Main.sessionMode.hasOverview

    //create an object that persists until gnome-shell is restarted, even if the extension is disabled
    PERSISTENTSTORAGE = {}
  }

  async enable() {
    DTP_EXTENSION = this
    SETTINGS = this.getSettings('org.gnome.shell.extensions.dash-to-panel')
    SETTINGS_CACHE = new Utils.SettingsCache(SETTINGS)
    DESKTOPSETTINGS = new Gio.Settings({
      schema_id: 'org.gnome.desktop.interface',
    })
    TERMINALSETTINGS = new Gio.Settings({
      schema_id: 'org.gnome.desktop.default-applications.terminal',
    })
    NOTIFICATIONSSETTINGS = new Gio.Settings({
      schema_id: 'org.gnome.desktop.notifications',
    })
    EXTENSION_PATH = this.path

    tracker = Shell.WindowTracker.get_default()

    //create a global object that can emit signals and conveniently expose functionalities to other extensions
    global.dashToPanel = new EventEmitter()

    // a prefs window that died without clearing the flag would keep
    // openPreferences from opening a new one; write only when it is set
    if (SETTINGS.get_boolean('prefs-opened'))
      SETTINGS.set_boolean('prefs-opened', false)

    await PanelSettings.init(SETTINGS)

    if (
      SETTINGS.get_boolean('hide-overview-on-startup') &&
      Main.layoutManager._startingUp
    ) {
      Main.sessionMode.hasOverview = false
      startupCompleteHandler = Main.layoutManager.connect(
        'startup-complete',
        () => {
          Main.sessionMode.hasOverview = this._realHasOverview

          // the startup animation is already running when the extension init code is executed.
          // Since there is no way to prevent the animation from running, hide the overview when
          // it completes
          Main.overview.hide()
        },
      )
    }

    this.enableGlobalStyles()

    panelManager = new PanelManager.PanelManager()
    panelManager.enable()
  }

  disable() {
    PanelSettings.disable(SETTINGS)
    panelManager.disable()
    PanelSettings.clearCache()

    SETTINGS_CACHE.destroy()

    DTP_EXTENSION = null
    SETTINGS = null
    SETTINGS_CACHE = null
    DESKTOPSETTINGS = null
    TERMINALSETTINGS = null
    panelManager = null

    delete global.dashToPanel

    this.disableGlobalStyles()

    AppIcons.resetRecentlyClickedApp()

    if (startupCompleteHandler) {
      Main.layoutManager.disconnect(startupCompleteHandler)
      startupCompleteHandler = null
    }

    Main.sessionMode.hasOverview = this._realHasOverview
  }

  openPreferences() {
    if (SETTINGS.get_boolean('prefs-opened')) {
      let prefsWindow = Utils.getAllMetaWindows().find(
        (w) =>
          w.title == 'Dash to Panel' &&
          w.wm_class == 'org.gnome.Shell.Extensions',
      )

      if (prefsWindow) Main.activateWindow(prefsWindow)

      return
    }

    super.openPreferences()
  }

  resetGlobalStyles() {
    this.disableGlobalStyles()
    this.enableGlobalStyles()
  }

  enableGlobalStyles() {
    let globalBorderRadius = SETTINGS.get_int('global-border-radius')

    if (globalBorderRadius)
      Main.layoutManager.uiGroup.add_style_class_name(
        `br${globalBorderRadius * 4}`,
      )
  }

  disableGlobalStyles() {
    ;['br4', 'br8', 'br12', 'br16', 'br20'].forEach((c) =>
      Main.layoutManager.uiGroup.remove_style_class_name(c),
    )
  }
}
