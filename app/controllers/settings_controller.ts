import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'
import app from '@adonisjs/core/services/app'
export default class SettingsController {
    async index({view}: HttpContext) {
		const product = await Setting.find(1);
        let a='';
        if(product){
            a = JSON.parse(product.data)
        }
		return view.render('admin/setting/index.edge',{data:product,olddata:a})
	}

    async update({request,response}: HttpContext) {
        let s = await Setting.find(1)
        if(s){
            s.data=JSON.stringify(request.all())
            await s.save();
        }
		return response.redirect('back')
	}

    async logoupdate({request,response}: HttpContext) {
        let s = await Setting.find(1)
        const logo = request.file('logo')
        const wallet_logo = request.file('wallet_logo')
        const model_banner = request.file('model_banner')
        const ficon = request.file('ficon')
        const icon192 = request.file('icon192')
        const icon512 = request.file('icon512')
        const auto_pay_logo = request.file('auto_pay_logo')
        let date_ob = new Date();

        await model_banner?.move(app.publicPath('uploads'), {
            name: ("0" + date_ob.getDate()).slice(-2)+("0" + (date_ob.getMonth() + 1)).slice(-2)+date_ob.getFullYear()+date_ob.getHours()+date_ob.getMinutes()+date_ob.getSeconds()+date_ob.getMilliseconds()+'.'+model_banner.extname,
            overwrite: true, // overwrite in case of conflict
        })

        await logo?.move(app.publicPath('uploads'), {
            name: ("0" + date_ob.getDate()).slice(-2)+("0" + (date_ob.getMonth() + 1)).slice(-2)+date_ob.getFullYear()+date_ob.getHours()+date_ob.getMinutes()+date_ob.getSeconds()+date_ob.getMilliseconds()+'.'+logo.extname,
            overwrite: true, // overwrite in case of conflict
        })

        await wallet_logo?.move(app.publicPath('uploads'), {
            name: ("0" + date_ob.getDate()).slice(-2)+("0" + (date_ob.getMonth() + 1)).slice(-2)+date_ob.getFullYear()+date_ob.getHours()+date_ob.getMinutes()+date_ob.getSeconds()+date_ob.getMilliseconds()+'.'+wallet_logo.extname,
            overwrite: true, // overwrite in case of conflict
        })

        await ficon?.move(app.publicPath('uploads'), {
            name: ("0" + date_ob.getDate()).slice(-2)+("0" + (date_ob.getMonth() + 1)).slice(-2)+date_ob.getFullYear()+date_ob.getHours()+date_ob.getMinutes()+date_ob.getSeconds()+date_ob.getMilliseconds()+'.'+ficon.extname,
            overwrite: true, // overwrite in case of conflict
        })

        await icon192?.move(app.publicPath('uploads'), {
            name: ("0" + date_ob.getDate()).slice(-2)+("0" + (date_ob.getMonth() + 1)).slice(-2)+date_ob.getFullYear()+date_ob.getHours()+date_ob.getMinutes()+date_ob.getSeconds()+date_ob.getMilliseconds()+'.'+icon192.extname,
            overwrite: true, // overwrite in case of conflict
        })

        await icon512?.move(app.publicPath('uploads'), {
            name: ("0" + date_ob.getDate()).slice(-2)+("0" + (date_ob.getMonth() + 1)).slice(-2)+date_ob.getFullYear()+date_ob.getHours()+date_ob.getMinutes()+date_ob.getSeconds()+date_ob.getMilliseconds()+'.'+icon512.extname,
            overwrite: true, // overwrite in case of conflict
        })

        await auto_pay_logo?.move(app.publicPath('uploads'), {
            name: ("0" + date_ob.getDate()).slice(-2)+("0" + (date_ob.getMonth() + 1)).slice(-2)+date_ob.getFullYear()+date_ob.getHours()+date_ob.getMinutes()+date_ob.getSeconds()+date_ob.getMilliseconds()+'.'+auto_pay_logo.extname,
            overwrite: true, // overwrite in case of conflict
        })

        if(s && logo && logo.fileName)s.logo=logo.fileName;
        if(s && wallet_logo && wallet_logo.fileName)s.wallet_logo=wallet_logo.fileName;
        if(s && model_banner && model_banner.fileName)s.model_banner=model_banner.fileName;
        if(s && ficon && ficon.fileName)s.ficon=ficon.fileName;
        if(s && icon192 && icon192.fileName)s.icon192=icon192.fileName;
        if(s && icon512 && icon512.fileName)s.icon512=icon512.fileName;
        if(s && auto_pay_logo && auto_pay_logo.fileName)s.auto_pay_logo=auto_pay_logo.fileName;
        await s?.save()
       
        return response.redirect('back')
    }
}