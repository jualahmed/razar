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
   link: vine.string().trim().minLength(4),
  })
)


export const updateProductValidator = vine.compile(
  vine.object({
    link: vine.string().trim().minLength(4),
  })
)
