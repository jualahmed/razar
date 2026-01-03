import type { HttpContext } from '@adonisjs/core/http'
import { createProductValidator,updateProductValidator } from '#validators/product'
import Product from '#models/product'
import app from '@adonisjs/core/services/app'
import Package from '#models/package'

export default class ProductsController {
  	async index({view,request}: HttpContext) {
		const page = request.input('page', 1)
        const limit = 10
		const product = await Product.query().paginate(page, limit);
		return view.render('admin/product/index.edge',{data:product})
	}

	async create({view}: HttpContext) {
		return view.render('admin/product/create.edge')
	}

	async store({ request,response,session }: HttpContext) {
		try {
			const payload = await request.validateUsing(createProductValidator)
			let data = new Product()

			data.name=payload.name;
			data.slug=payload.slug;
			data.description=payload.description;
			data.save()

			session.flash('success', "SuccessFully Created")
			response.redirect('/admin/product')
		} catch (error) {
			session.flash('old', request.all())
			session.flash('errors', error.messages)
			response.redirect('back')
		}
	}

	async show({ params,response }: HttpContext) {
		const product = await Product.find(params.id);
		product?.delete()
		return response.redirect().withQs().back()
	}
   
	async edit({ params,view }: HttpContext) {
		const product = await Product.find(params.id);
		if(!product) return view.render('404')
		return view.render('admin/product/edit.edge',{product:product})
	}

	async update({ params, request,session,response }: HttpContext) {
		try {
			const payload = await request.validateUsing(updateProductValidator)
			let data = await Product.find(params.id)

		
			if(data){
				data.name=payload.name;
				data.slug=payload.slug;
				data.description=payload.description;
				data.save()
			}

			session.flash('success', "SuccessFully Updated")
			return response.redirect().withQs().back()
		} catch (error) {
			session.flash('old', request.all())
			session.flash('errors', error.messages)
			return response.redirect().withQs().back()
		}
	}

	async addfield({ params, request ,response}: HttpContext) {
		const payload = request.all()
		let data = await Product.find(params.id)
		if(data){
			let info: any[] = [];
			try {
			info = data.info ? JSON.parse(data.info) : [];
			} catch (error) {
			console.error("Failed to parse info JSON", error);
			info = []; 
			}

			info.push({
				id: info.length + 1,
				name: payload.name,
				value: payload.value
			});
			data.info = JSON.stringify(info);
			data.save()
		}
		response.redirect().back()
	}

	async deletefield({ params,response }: HttpContext) {
		let data = await Product.find(params.id)
		if(data){
			let info: any[] = [];
			try {
				info = data.info ? JSON.parse(data.info) : [];
			} catch (error) {
				console.error("Failed to parse info JSON", error);
				info = []; 
			}
			info = info.filter((item) => item.id != params.field_id);
			data.info = JSON.stringify(info);
			data.save()
		}
		response.redirect().back()
	}
	
}