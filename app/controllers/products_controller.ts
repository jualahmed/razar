import type { HttpContext } from '@adonisjs/core/http'
import { createProductValidator,updateProductValidator } from '#validators/product'
import Product from '#models/product'
import app from '@adonisjs/core/services/app'
import Category from '#models/category'
import Package from '#models/package'

export default class ProductsController {
  	async index({view,request}: HttpContext) {
		const page = request.input('page', 1)
        const limit = 10
		const product = await Product.query().paginate(page, limit);
		return view.render('admin/product/index.edge',{data:product})
	}

	async create({view}: HttpContext) {
		const category = await Category.all();
		return view.render('admin/product/create.edge',{categories:category})
	}

	async store({ request,response,session }: HttpContext) {
		try {
			const payload = await request.validateUsing(createProductValidator)
			let data = new Product()

			const logo = request.file('logo')
			console.log(logo)
			let date_ob = new Date();

			await logo?.move(app.publicPath('uploads'), {
				name: ("0" + date_ob.getDate()).slice(-2)+("0" + (date_ob.getMonth() + 1)).slice(-2)+date_ob.getFullYear()+date_ob.getHours()+date_ob.getMinutes()+date_ob.getSeconds()+date_ob.getMilliseconds()+'.'+logo.extname,
				overwrite: true, // overwrite in case of conflict
			})

			if(data && logo && logo.fileName)data.logo=logo.fileName;

			data.name=payload.name;
			data.slug=payload.name;
			data.description='test proudct';
			data.category_id=payload.category_id;
			data.link='#';
			data.saletype=payload.saletype;
			data.sale_price=payload.sale_price;
			data.buy_price=payload.buy_price;
			data.quantity=100000;
			data.uid_check=0;
			data.lavel=payload.lavel;
			data.info='[{"id":1,"name":"player_id","value":"এখানে আইডি কোড দিন ।"}]';
			data.is_active=1;
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
		const category = await Category.all();
		const product = await Product.find(params.id);
		if(!product) return view.render('404')
		const packages = await Package.query().preload('product').where('product_id',product.id);
		return view.render('admin/product/edit.edge',{packages:packages,product:product,categories:category})
	}

	async update({ params, request,session,response }: HttpContext) {
		try {
			const payload = await request.validateUsing(updateProductValidator)
			let data = await Product.find(params.id)

			const logo = request.file('logo')

			let date_ob = new Date();
			await logo?.move(app.publicPath('uploads'), {
				name: ("0" + date_ob.getDate()).slice(-2)+("0" + (date_ob.getMonth() + 1)).slice(-2)+date_ob.getFullYear()+date_ob.getHours()+date_ob.getMinutes()+date_ob.getSeconds()+date_ob.getMilliseconds()+'.'+logo.extname,
				overwrite: true, // overwrite in case of conflict
			})

			var translate_re:any = /&(nbsp|amp|quot|lt|gt|sol|#x2F);/g;
			const translate:any = {
				"nbsp": " ",
				"amp": "&",
				"quot": "\"",
				"lt": "<",
				"gt": ">",
				"sol": "/",  // Corrected mapping
				"#x2F": "/", // Added mapping for forward slash
			};

			var desc = payload.description.replace(translate_re, function(match:any, entity:any) {
				console.log(match)
				return translate[entity];
			}).replace(/&#(\d+);/gi, function(match, numStr) {
				console.log(match)
				var num = parseInt(numStr, 10);
				return String.fromCharCode(num);
			});

			if(data){
				if(logo && logo.fileName)data.logo=logo.fileName;
				data.name=payload.name;
				data.category_id=payload.category_id;
				data.slug=payload.slug;
				data.description=desc;
				data.saletype=payload.saletype;
				data.link=payload.link;
				data.uid_check=payload.uid_check;
				data.sale_price=payload.sale_price;
				data.buy_price=payload.buy_price;
				data.quantity=payload.quantity;
				data.notify=payload.notify;
				data.lavel=payload.lavel;
				data.is_active=payload.is_active;
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