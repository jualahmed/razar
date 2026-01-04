import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
export default class HomeController {
	async upload({request,response}: HttpContext) {
		const file = request.file('file', {
			size: '2mb',
		})

		const uniqueFileName = `${new Date().getTime()}-${file?.clientName}`
		await file?.move(app.publicPath('uploads'), {
			name: uniqueFileName,
			overwrite: true,
		})

		
		return response.ok({
			message: 'File uploaded successfully',
		})
	}
}