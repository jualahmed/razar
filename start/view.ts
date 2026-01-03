import edge from 'edge.js'

async function setupEdgeGlobals() {
  try {
    const Setting = (await import('#models/setting')).default
    const s = await Setting.find(1)

    let hide_withdrow = 0
    if (s) {
      const data = JSON.parse(s.data)
      hide_withdrow = data.hide_withdrow || 0
    }

    edge.global('hide_withdrow', hide_withdrow)
  } catch (err) {
    if (
      err?.code === 'ER_NO_SUCH_TABLE' ||         // MySQL/MariaDB
      err?.message?.includes('doesn\'t exist') || // General fallback
      err?.message?.includes('no such table')     // SQLite
    ) {
      console.warn('[Edge Global] Skipped: settings table not found.')
    } else {
      console.error('[Edge Global] Failed:', err)
    }
  }
}

setupEdgeGlobals()
