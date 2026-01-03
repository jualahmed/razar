import type { HttpContext } from '@adonisjs/core/http'
import Purchase from '#models/purchase'
import Product from '#models/product'
import Package from '#models/package'
import Digicode from '#models/digicode'
export default class PurchasesController {
 
    async index({view,request}: HttpContext) {
		const page = request.input('page', 1)
        const limit = 10
		const product = await Purchase.query().preload('package').orderBy('id','desc').paginate(page, limit);
		const prod = await Product.all();
		return view.render('admin/purchase/index.edge',{data:product,prod:prod})
	}

	async use({params,response}: HttpContext) {
        let digicode = await Digicode.find(params.id);
        if(digicode && digicode.status==0){
            digicode.status=1;
            await digicode.save()
            let pa = await Package.find(digicode.package_id);
            if(pa)
           {
                pa.stock=pa.stock-1;
                await pa.save()
           }
        }
        return response.redirect('back')
    }

    async store({ request,response }: HttpContext) {
        try {
            const { code, package_id } = request.all();
            const lines = code.split('\n');
            const qty = lines.length;
            if (qty > 0) {
                const packages = await Package.find(package_id);
                if(packages){
                    const purchase = await Purchase.create({
                        package_id: packages.id,
                        qty,
                    });
            
                    packages.stock += qty;
                    await packages.save();
            
                    // Insert codes here
                    for (const value of lines) {
                        await Digicode.create({
                            purchase_id: purchase.id,
                            package_id: packages.id,
                            product_id: packages.product_id,
                            code: value.replace(/[\r\n]+/g, ''),
                            status: 0,
                        });
                    }
                }
        
                return response.redirect('back');
            }
        } catch (error) {
            // Handle exceptions
            console.error(error);
            return response.status(500).send('An error occurred while processing the request.');
        }
    }

    async storeunipin({ request,response }: HttpContext) {

        const voucherPrefixMap = {
            '25': ['BDMB-T', 'UPBD-Q'],
            '50': ['BDMB-U', 'UPBD-R'],
            '115': ['BDMB-J', 'UPBD-G'],
            '240': ['BDMB-I', 'UPBD-F'],
            '610': ['BDMB-K', 'UPBD-H'],
            '1240': ['BDMB-L', 'UPBD-I'],
            '2530': ['BDMB-M', 'UPBD-J'],
            '161': ['BDMB-Q', 'UPBD-N'],
            '800': ['BDMB-S', 'UPBD-P'],
            '162': ['BDMB-R', 'UPBD-O'],
            '2000': ['UPBD-7'],
        };

        try {
            const { code } = request.all();
            const lines = code.split('\n');
            const qty = lines.length;

            if (qty > 0) {
                let purchase = await Purchase.create({
                    package_id: 8000000,
                    qty: 0,
                });
            
                for (let value of lines) {
                    let voucherPrefix = value.trim().substring(0, 6);
                    let packageItem = null;
            
                    // Find the matching package based on the prefix
                    for (const [key, prefixes] of Object.entries(voucherPrefixMap)) {
                        if (prefixes.includes(voucherPrefix)) {
                            packageItem = await Package.query().where('tag_line',key).first();
                            break; // Exit the loop once a match is found
                        }
                    }
            
                    if (packageItem) {
                        // Increase package stock and update database
                        packageItem.stock += 1;
                        await packageItem.save();
            
                        // Increase purchase quantity and update database
                        purchase.qty += 1;
                        await purchase.save();
            
                        // Create a new Digicode entry
                        await Digicode.create({
                            purchase_id: purchase.id,
                            package_id: packageItem.id,
                            product_id: packageItem.product_id,
                            code: value,
                            status: 0
                        });
                    }
                }
        
                return response.redirect('back');
            }

        } catch (error) {
            // Handle exceptions
            console.error(error);
            return response.status(500).send('An error occurred while processing the request.');
        }
    }

    async show({ params }: HttpContext) {
        let packages = await Package.query().where('product_id',params.id)
        return packages
    }

    async edit({ params,view }: HttpContext) {
        let packages = await Digicode.query().where('purchase_id',params.id)
        return view.render('admin/purchase/views.edge',{data:packages})
    }

    async deletevoucher({ params,response }: HttpContext) {
        const asas = await Digicode.query().where('purchase_id', params.id);
        await Digicode.query().where('purchase_id', params.id).delete();
        const purchase = await Purchase.find(params.id);
        if(purchase && asas)
        {
            const packages = await Package.find(purchase.package_id);
            if(packages){
                packages.stock=packages.stock-purchase.qty
                await packages.save();
            }
            await purchase.delete()
        }
        return response.redirect('back')
    }
}