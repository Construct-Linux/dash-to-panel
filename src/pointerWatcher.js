// GNOME Shell 51 has no ui/pointerWatcher.js: watch the cursor tracker instead
let watcher

export function getPointerWatcher() {
  return new Promise((resolve) => {
    watcher = watcher || {
      currentId: 0,
      watches: {},
      positionInvalidateId: 0,
      addWatch: function (delay, cb) {
        let cursorTracker = global.backend.get_cursor_tracker()
        let id = ++this.currentId

        if (!this.positionInvalidateId)
          this.positionInvalidateId = cursorTracker.connect(
            'position-invalidated',
            () => {
              let now = Date.now()

              Object.values(this.watches).forEach((w) => {
                if (now > w.ts + w.delay) {
                  const [coords] = cursorTracker.get_pointer()

                  w.cb(coords.x, coords.y)
                  w.ts = now
                }
              })
            },
          )

        this.watches[id] = { ts: Date.now(), delay, cb }

        return id
      },
      _removeWatch: function (id) {
        delete this.watches[id]

        if (!Object.keys(this.watches).length) {
          global.backend
            .get_cursor_tracker()
            .disconnect(this.positionInvalidateId)
          this.positionInvalidateId = 0
        }
      },
    }

    resolve(watcher)
  })
}
