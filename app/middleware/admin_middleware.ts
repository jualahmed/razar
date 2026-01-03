import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
	async handle(ctx: HttpContext, next: NextFn) {
		try {
			let user = ctx.auth.user;
			if(user && user.is_admin!=1){
				return ctx.response.unauthorized({ error: 'You Are Not Unauthorized To access' })
			}
		} catch (error) {
			return ctx.response.unauthorized({ error: 'Authentication required' })
		}
		await next()
	}
}