import vine from '@vinejs/vine'

export const createMatchValidator = vine.compile(
    vine.object({
        name: vine.string().trim(),
        status: vine.string().trim(),
        win_prize: vine.number(),
        per_kill: vine.number(),
        max_join: vine.number(),
        entry_fee: vine.number(),
        product_id: vine.number(),
        is_hide: vine.number(),
        live_link: vine.string(),
        type: vine.string().trim(),
        version: vine.string().trim(),
        map: vine.string().trim(),
        price_pool: vine.string().trim(),
        rules: vine.string().trim(),
        start_time: vine.string(),
        room_detail: vine.string().trim(),
    })
  )
  
  export const updateMatchValidator = vine.compile(
    vine.object({
        name: vine.string().trim(),
        status: vine.string().trim(),
        win_prize: vine.number(),
        per_kill: vine.number(),
        product_id: vine.number(),
        entry_fee: vine.number(),
        is_hide: vine.number(),
        max_join: vine.number(),
        start_time: vine.string(),
        live_link: vine.string(),
        type: vine.string().trim(),
        version: vine.string().trim(),
        map: vine.string().trim(),
        price_pool: vine.string().trim(),
        rules: vine.string().trim(),
        room_detail: vine.string().trim(),
    })
  )
  