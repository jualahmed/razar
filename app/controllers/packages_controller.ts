import type { HttpContext } from '@adonisjs/core/http'
import Package from '#models/package'
import Product from '#models/product'
import { createPackageValidator,updatePackageValidator } from '#validators/package'
export default class PackagesController {
    async index({view,request}: HttpContext) {
		const page = request.input('page', 1)
        const limit = 10
		let packages=[];
		const product_id = request.input('product_id')
		const tag_line = request.input('tag_line')
		if(tag_line){
			packages = await Package.query().preload('product').where('tag_line',tag_line);
		}
		else if(product_id){
            packages = await Package.query().preload('product').where('product_id',product_id);
        }else{
		 	packages = await Package.query().preload('product').paginate(page, limit);
		}
		const product = await Product.all();
		return view.render('admin/package/index.edge',{data:packages,product:product})
	}

	async create({view}: HttpContext) {
		const products = await Product.all();
		return view.render('admin/package/create.edge',{products:products})
	}

	async store({ request,response,session }: HttpContext) {
		try {
			const payload = await request.validateUsing(createPackageValidator)
			let data = new Package()
			data.name=payload.name;
			data.sale_price=payload.sale_price;
			data.buy_price=payload.buy_price;
			data.stock=payload.stock;
			data.coin=payload.coin;
			data.product_id=payload.product_id;
			data.common_price=payload.common_price;
			data.extra_fee=payload.extra_fee;
			data.lavel=payload.lavel;
			data.is_auto=payload.is_auto;
			data.server='no';
			data.is_hide=request.input('is_hide');
			data.save()
			session.flash('success', "SuccessFully Created")
			if(request.qs().p_id!= 'undefined'){
				response.redirect('/admin/product/'+request.qs().p_id+'/edit')
			}
			else{
				response.redirect('/admin/package')
			}
		} catch (error) {
			session.flash('old', request.all())
			session.flash('errors', error.messages)
			return response.redirect().withQs().back();
		}
	}

	async show({ params ,response}: HttpContext) {
		const product = await Package.find(params.id);
		product?.delete()
		return response.redirect().withQs().back();
	}

	async edit({ params,view }: HttpContext) {
		const product = await Package.find(params.id);
		const products = await Product.all();
		const packages = await Package.all();
		let shelltype = await Shelltype.all();
		return view.render('admin/package/edit.edge',{product:product,products:products,packages:packages,shelltype:shelltype})
	}
   
	async update({ params, request,session ,response}: HttpContext) {
		try {
			const payload = await request.validateUsing(updatePackageValidator)
			let data = await Package.find(params.id)
			
			if(data){
				data.name=payload.name;
				data.sale_price=payload.sale_price;
				data.buy_price=payload.buy_price;
				data.stock=payload.stock;
				data.coin=payload.coin;
				data.shelltype=payload.shelltype;
				data.product_id=payload.product_id;
				data.common_price=payload.common_price;
				data.extra_fee=payload.extra_fee;
				data.relative_unipin_ids=request.input('relative_unipin_ids');
				data.is_hide=request.input('is_hide');
				data.tag_line=request.input('tag_line');
				data.server=request.input('server');
				data.lavel=payload.lavel;
				data.is_auto=payload.is_auto;
				data.save()
			}
			session.flash('success', "SuccessFully Created")
			return response.redirect().withQs().back();
		} catch (error) {
			session.flash('old', request.all())
			session.flash('errors', error.messages)
			return response.redirect().withQs().back();
		}
	}

	async addrelariveid({params,request,response}:HttpContext){
		const product = await Package.find(params.id);
		let uid = request.input('package_id')
		if(product && uid)
		{
			let relativeUnipinIds = []
			let relativeUnipinIdsa = JSON.parse(product.relative_unipin_ids);
			if(relativeUnipinIdsa)relativeUnipinIds=relativeUnipinIdsa
			relativeUnipinIds.push(uid)
			product.relative_unipin_ids = JSON.stringify(relativeUnipinIds)
			await product.save();
			response.redirect().back()
		}
	}

	async deleterelative({ params, response, session }: HttpContext) {
		const product = await Package.find(params.id)

		if (!product) {
			session.flash('error', 'Package not found.')
			return response.redirect().back()
		}

		// Restricted tag_line list
		const blockedIds = [
			8066, 8067, 93821, 93822, 44105, 93823, 93824, 93825,
			93826, 93827, 74385, 74386, 74387, 67386,
			108227, 108228, 108229, 108230, 108231, 108232
		]

		// Check if tag_line is restricted
		if (blockedIds.includes(Number(product.tag_line))) {
			session.flash('error', '❌ This package cannot be modified.')
			return response.redirect().back()
		}

		// Safe delete
		let relativeid = JSON.parse(product.relative_unipin_ids || '[]')
		relativeid.splice(params.index, 1)
		product.relative_unipin_ids = JSON.stringify(relativeid)
		await product.save()

		session.flash('success', '✅ Relative ID deleted successfully.')
		return response.redirect().back()
	}
}