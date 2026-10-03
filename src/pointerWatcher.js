// GNOME Shell 51 has no ui/pointerWatcher.js: watch the cursor tracker instead
import GLib from 'gi://GLib'

let watcher

// The first motion after a check disconnects from position-invalidated and
// arms one timeout: no JS runs per motion event, and the check after the
// timeout sees where the pointer stopped.
export function getPointerWatcher() {
  watcher = watcher || {
    currentId: 0,
    watches: new Map(),
    positionInvalidateId: 0,
    timeoutId: 0,
    addWatch(delay, cb) {
      let id = ++this.currentId

      this.watches.set(id, { delay, cb })
      this._connect()

      return id
    },
    removeWatch(id) {
      this.watches.delete(id)

      if (this.watches.size) return

      this._disconnect()

      if (this.timeoutId) {
        GLib.source_remove(this.timeoutId)
        this.timeoutId = 0
      }
    },
    _connect() {
      if (!this.watches.size || this.positionInvalidateId || this.timeoutId)
        return

      this.positionInvalidateId = global.backend
        .get_cursor_tracker()
        .connect('position-invalidated', () => this._onMotion())
    },
    _disconnect() {
      if (!this.positionInvalidateId) return

      global.backend.get_cursor_tracker().disconnect(this.positionInvalidateId)
      this.positionInvalidateId = 0
    },
    _onMotion() {
      let delay = Math.min(...[...this.watches.values()].map((w) => w.delay))

      this._disconnect()
      this.timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
        let [coords] = global.backend.get_cursor_tracker().get_pointer()

        this.timeoutId = 0
        this.watches.forEach((w) => w.cb(coords.x, coords.y))
        this._connect()

        return GLib.SOURCE_REMOVE
      })
    },
  }

  return watcher
}
