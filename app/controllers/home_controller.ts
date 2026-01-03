import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import MatchUser from '#models/match_user'
export default class HomeController {
	async upload({request,response,params}: HttpContext) {
		const file = request.file('file', {
			size: '2mb',
		})

		const uniqueFileName = `${new Date().getTime()}-${file?.clientName}`
		await file?.move(app.publicPath('uploads'), {
			name: uniqueFileName,
			overwrite: true,
		})

		let metchuser = await MatchUser.query().where('match_id',params.matchid).where('user_id',params.userid).first()
		if(!metchuser) return response.badRequest({ message: 'Please join the match to uplaod the file' })
		metchuser.ss = uniqueFileName
		await metchuser.save()
		
		return response.ok({
			message: 'File uploaded successfully',
		})
	}
}