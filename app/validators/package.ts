import vine from '@vinejs/vine'

export const createPackageValidator = vine.compile(
    vine.object({
      name: vine.string().trim().minLength(4),
      sale_price: vine.number(),
      buy_price: vine.number(),
      stock: vine.number(),
      coin: vine.number(),
      product_id: vine.number(),
      common_price: vine.number(),
      extra_fee: vine.number(),
      lavel: vine.number(),
      is_auto: vine.number(),
    })
  )
  
  
  export const updatePackageValidator = vine.compile(
    vine.object({
        name: vine.string().trim().minLength(4),
        sale_price: vine.number(),
        buy_price: vine.number(),
        stock: vine.number(),
        coin: vine.number(),
        shelltype: vine.number(),
        product_id: vine.number(),
        common_price: vine.number(),
        extra_fee: vine.number(),
        lavel: vine.number(),
        is_auto: vine.number(),
    })
  )
  