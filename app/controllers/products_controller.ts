import type { HttpContext } from '@adonisjs/core/http'
import { createProductValidator,updateProductValidator } from '#validators/product'
import Product from '#models/product'
import Package from '#models/package'
import axios from 'axios'

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

			let input:any = await this.convertRazerGoldUrlToApi(payload.link);
			let slug = await this.getslug(payload.link);
			console.log("API URL:", input);
			const responsea = await axios.get(input,
			{
				headers: {
				accept: "application/json, text/plain, */*",
				referer: "https://gold.razer.com/",
				"user-agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
				},
			}
			);

			console.log(responsea.data);

			data.link=payload.link;
			await data.save()

			responsea.data.gameSkus.forEach(async (element: any) => {
					let exiting = await Package.query().where('coin',element.productId).first()
					if(exiting){
						return;
					}
					let pac  = new Package();
					pac.name=element.vanityName;
					pac.product_id=data.id;
					pac.tag_line=slug;
					pac.sale_price=element.pricings[0].unitPrice;
					pac.buy_price=element.amountInRzSilver;
					pac.coin=element.productId;
					await pac.save()
			});

			session.flash('success', "SuccessFully Created")
			response.redirect('/admin/product')
		} catch (error) {
			session.flash('old', request.all())
			session.flash('errors', error.messages)
			response.redirect('back')
		}
	}

	async getslug(inputUrl:any) {
		try {
			const url = new URL(inputUrl.trim());

			const parts = url.pathname.split("/").filter(p => p.length);

			const slug = parts[parts.length - 1];
			console.log("Catalog Slug:", slug);
			return slug;
		} catch (err) {
			console.error("Invalid URL:", err);
			return null;
		}
	}

	async convertRazerGoldUrlToApi(inputUrl:any) {
		try {
			const url = new URL(inputUrl.trim());

			// Expect URL like: /<region>/<lang>/gold/catalog/<slug>
			const parts = url.pathname.split("/").filter(p => p.length);

			// last part is the catalog slug
			const slug = parts[parts.length - 1];

			// You can adjust the catalog ID (2) accordingly
			const catalogId = 2;

			const apiUrl = `${url.origin}/api/v2/content/gold/catalogs/${catalogId}/${slug}`;
			return apiUrl;
		} catch (err) {
			console.error("Invalid URL:", err);
			return null;
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
				
				let input:any = await this.convertRazerGoldUrlToApi(payload.link);
				let slug = await this.getslug(payload.link);
				const responsea = await axios.get(input,
				{
					headers: {
					accept: "application/json, text/plain, */*",
					referer: "https://gold.razer.com/",
					"user-agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
					},
					timeout: 15000,
				}
				);

				data.link=payload.link;
				await data.save()

				responsea.data.gameSkus.forEach(async (element: any) => {
						let exiting = await Package.query().where('coin',element.productId).first()
						if(exiting){
							return;
						}
						let pac  = new Package();
						pac.name=element.vanityName;
						pac.product_id=data.id;
						pac.tag_line=slug;
						pac.sale_price=element.pricings[0].unitPrice;
						pac.buy_price=element.amountInRzSilver;
						pac.coin=element.productId;
						await pac.save()
				});

				data.link=payload.link;
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