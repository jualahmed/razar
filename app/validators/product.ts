import vine from '@vinejs/vine'


export const AddmoneyValidator = vine.compile(
	vine.object({
	  amount: vine
	  .number()
	  .min(1)
	  .max(100000),
	})
  )

export const UserRegisterValidator = vine.compile(
  vine.object({
    api: vine.string().trim().minLength(4),
    email: vine.string().trim().minLength(4),
    phone: vine.string().trim().escape().minLength(4),
    password: vine.string().confirmed()
  })
)

export const ConfirmPasswordValidator = vine.compile(
  vine.object({
    old_password: vine.string(),
    password: vine.string().confirmed()
  })
)


export const createProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(4),
    sale_price: vine.number(),
    saletype: vine.number(),
    buy_price: vine.number(),
    lavel: vine.number(),
    category_id: vine.number(),
  })
)


export const updateProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(4),
    slug: vine.string().trim().minLength(4),
    description: vine.string().trim().escape().minLength(12),
    link: vine.string().trim(),
    sale_price: vine.number(),
    saletype: vine.number(),
    uid_check: vine.number(),
    notify: vine.number(),
    category_id: vine.number(),
    buy_price: vine.number(),
    quantity: vine.number(),
    lavel: vine.number(),
    is_active: vine.number(),
  })
)
