import type { HttpContext } from '@adonisjs/core/http'
import Banar from '#models/banar'
import app from '@adonisjs/core/services/app'
export default class BanarsController {
    async index({view,request}: HttpContext) {
        const page = request.input('page', 1)
        const limit = 10
		const packages = await Banar.query().paginate(page, limit);
		return view.render('admin/banar/index.edge',{data:packages})
   	}

    async create({view}: HttpContext) {
        return view.render('admin/banar/create.edge')
    }

    async store({ request ,session,response}: HttpContext) {
        try {
			const payload = request.all()
			let data = new Banar()

			data.email=payload.email;
			data.password=payload.password;
			data.key=payload.key;
			data.save()

			session.flash('success', "SuccessFully Created")
			response.redirect('/admin/banar')
		} catch (error) {
			session.flash('old', request.all())
			session.flash('errors', error.messages)
			response.redirect('back')
		}
    }


    async show({ params ,response}: HttpContext) {
        const product = await Banar.find(params.id);
		product?.delete()
		return response.redirect().back();
    }


    async edit({ params,view }: HttpContext) {
        const product = await Banar.find(params.id);
        return view.render('admin/banar/edit.edge',{product:product})
    }

    async update({ params, request,session,response }: HttpContext) {

        try {
			const payload = request.all()
			let data = await Banar.find(params.id)

			
			if(data){
				
			data.email=payload.email;
			data.password=payload.password;
			data.key=payload.key;
				data.save()
			}

			session.flash('success', "SuccessFully Updated")
			response.redirect('/admin/banar')
		} catch (error) {
			session.flash('old', request.all())
			session.flash('errors', error.messages)
			response.redirect('back')
		}

    }
}