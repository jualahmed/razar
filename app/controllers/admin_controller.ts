import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import auth from '@adonisjs/auth/services/main'
import { ConfirmPasswordValidator } from '#validators/product'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import Order from '#models/order'
import db from '@adonisjs/lucid/services/db'
import Package from '#models/package'
import Account from '#models/account'
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
const execAsync = promisify(exec);

const hexToHsl = (hex:any) => {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0,
	  s = 0,
	  l = (max + min) / 2;
  
	if (max !== min) {
	  const d = max - min;
	  s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	  switch (max) {
		case r:
		  h = (g - b) / d + (g < b ? 6 : 0);
		  break;
		case g:
		  h = (b - r) / d + 2;
		  break;
		case b:
		  h = (r - g) / d + 4;
		  break;
	  }
	  h /= 6;
	}
  
	return `${(h * 360).toFixed(2)} ${(s * 100).toFixed(2)}% ${(l * 100).toFixed(2)}%`;
};
  

export default class AdminController {

	async color({ view }: HttpContext) {
		try {
			const projectRoot = process.cwd();
			const scriptPath = path.join(projectRoot, '../client/app/globals.css');
			await execAsync(`chmod +x ${scriptPath}`);
			const cssContent = fs.readFileSync(scriptPath, 'utf-8')

			const primaryMatch = cssContent.match(/--primary: ([^;]+);/);
			const secondaryMatch = cssContent.match(/--secondary: ([^;]+);/);

			return view.render('admin/color.edge',{primary:primaryMatch,secondary:secondaryMatch})
		} catch (error) {
			return error
		}
	}
	  
	async colorupdate({ request,response,session}: HttpContext) {
		try {
			const projectRoot = process.cwd();
			const scriptPath = path.join(projectRoot, '../client/app/globals.css');
			await execAsync(`chmod +x ${scriptPath}`);
			var cssContent = fs.readFileSync(scriptPath, 'utf-8')

			const primaryMatch = cssContent.match(/--primary: ([^;]+);/);
			const secondaryMatch = cssContent.match(/--secondary: ([^;]+);/);

			const primaryColor = hexToHsl(request.input('primary'))
			const secondaryColor = hexToHsl(request.input('secondary'))
			if (primaryMatch && primaryMatch[1]) {
				console.log(primaryMatch[0])
				console.log(primaryMatch)
				const newPrimary = primaryMatch[0].replace(/--primary: ([^;]+);/, `--primary: ${primaryColor};`);
				cssContent = cssContent.replace(primaryMatch[0], newPrimary);
			}

			if (secondaryMatch && secondaryMatch[1]) {
				const newSecondary = secondaryMatch[0].replace(/--secondary: ([^;]+);/, `--secondary: ${secondaryColor};`);
				cssContent = cssContent.replace(secondaryMatch[0], newSecondary);
			}
			fs.writeFileSync(scriptPath, cssContent, 'utf-8');
			session.flash("success", "Color Updated Successfully");
			return response.redirect().back()
		} catch (error) {
			return error
		}
	}


	async checkadminupdate({ response,session }: HttpContext) {
		try {
			const projectRoot = process.cwd();
			const scriptPath = path.join(projectRoot, 'update.sh');
			await execAsync(`chmod +x ${scriptPath}`);
			await execAsync(`nohup ${scriptPath} > ${projectRoot}/update.log 2>&1 &`);
			session.flash("success", "Update started, please wait for a while. and refresh");
			return response.redirect().back();
		} catch (error) {
			return error;
		}
	}


	async checkuserpdate({ response,session }: HttpContext) {
		try {	
			const projectRoot = process.cwd();
			const scriptPath = path.join(projectRoot, 'updateclient.sh');
			await execAsync(`chmod +x ${scriptPath}`);
			await execAsync(`nohup ${scriptPath} > ${projectRoot}/updateclient.log 2>&1 &`);
			session.flash("success", "updateclient started, please wait for a while. and refresh");
			return response.redirect().back();
		} catch (error) {
			return error
		}
	}
	

	async index({ view }: HttpContext) {
  const startOfMonth = DateTime.utc().startOf('month').toISO() // 1st day of the month at 00:00 UTC
  const now = DateTime.utc().toISO() // current UTC time
  const lastmont = DateTime.utc()
  let time = DateTime.local().setZone('Asia/Dhaka') // Get time in BDT
  let newDateUTC = time.startOf('day').toUTC().toISO({ includeOffset: false }) // Convert to UTC
  const startOfLastMonth = lastmont.minus({ months: 1 }).startOf('month')
  const endOfLastMonth = lastmont.startOf('month').minus({ milliseconds: 1 })
  if (newDateUTC == null) { return 0 }

  const order = await Order.query()
    .where('status', 'complete')
    .whereNotNull('product_id')
    .where('created_at', '>=', startOfMonth)
    .where('created_at', '<=', now)

  let comorder = await Order.query()
    .where('status', 'complete')
    .whereNotNull('product_id')
    .where('created_at', '>=', newDateUTC)

  const lastMonthOrders = await Order.query()
    .where('status', 'complete')
    .whereNotNull('product_id')
    .where('created_at', '>=', startOfLastMonth.toISO())
    .where('created_at', '<=', endOfLastMonth.toISO())

  const totalComplete = await Order.query()
    .where('status', 'complete')
    .whereNotNull('product_id')
    .count('* as total')

  const totalOrders = totalComplete[0].$extras.total

  let user = await User.query().where('created_at', '>=', newDateUTC)

  let today_sale = await db.query()
    .where('created_at', '>=', newDateUTC)
    .where('status', 'complete')
    .whereNotNull('product_id')
    .sum('sale_price as total')
    .from('orders')
    .first()

  let today_buy = await db.query()
    .where('created_at', '>=', newDateUTC)
    .where('status', 'complete')
    .whereNotNull('product_id')
    .sum('buy_price as total')
    .from('orders')
    .first()

  // sum user wallet balance
  let wallet = await db.query().sum('wallet as total').from('users').first()
  let coin = await db.query().sum('coin as total').from('users').first()
  let users = await User.all()

  let startDate = time.minus({ days: 1 }).startOf('day').toUTC().toISO();
  let endDate = time.minus({ days: 1 }).endOf('day').toUTC().toISO();
  if (startDate == null) { return 0 }
  if (endDate == null) { return 0 }

  let yesterday_sale = await db.query()
    .where("created_at", ">=", startDate)
    .where("created_at", "<=", endDate)
    .where("status", "complete")
    .whereNotNull('product_id')
    .sum("sale_price as total")
    .from("orders")
    .first();

  let buy_price = await db.query()
    .where("created_at", ">=", startDate)
    .where("created_at", "<=", endDate)
    .where("status", "complete")
    .whereNotNull('product_id')
    .sum("buy_price as total")
    .from("orders")
    .first();

  const nowss = DateTime.utc()
  const startOfThisMonth = nowss.startOf('month').toISO()
  const endOfThisMonth = nowss.toISO()
  const startOfLastMonths = nowss.minus({ months: 1 }).startOf('month').toISO()
  const endOfLastMonths = nowss.startOf('month').minus({ milliseconds: 1 }).toISO()

  // ✅ This Month
  const thisMonthSale = await Order.query()
    .where('status', 'complete')
    .whereNotNull('product_id')
    .where('createdAt', '>=', startOfThisMonth)
    .where('createdAt', '<=', endOfThisMonth)
    .sum('sale_price as total')

  const thisMonthBuy = await Order.query()
    .where('status', 'complete')
    .whereNotNull('product_id')
    .where('createdAt', '>=', startOfThisMonth)
    .where('createdAt', '<=', endOfThisMonth)
    .sum('buy_price as total')

  // ✅ Last Month
  const lastMonthSale = await Order.query()
    .where('status', 'complete')
    .whereNotNull('product_id')
    .where('createdAt', '>=', startOfLastMonths)
    .where('createdAt', '<=', endOfLastMonths)
    .sum('sale_price as total')

  const lastMonthBuy = await Order.query()
    .where('status', 'complete')
    .whereNotNull('product_id')
    .where('createdAt', '>=', startOfLastMonths)
    .where('createdAt', '<=', endOfLastMonths)
    .sum('buy_price as total')

  // ✅ Lifetime
  const lifetimeSale = await Order.query()
    .where('status', 'complete')
    .whereNotNull('product_id')
    .sum('sale_price as total')

  const lifetimeBuy = await Order.query()
    .where('status', 'complete')
    .whereNotNull('product_id')
    .sum('buy_price as total')

  let packages: any = []
  const tagLines = ['25', '50', '115', '240', '610', '1240', '2530', '161', '800', '2000','60', '325', '660', '1800', '3850','8100','16200','24300','32400','40500']
  packages = await Package.query().whereIn('tag_line', tagLines)

  if (packages && packages.length > 0) {
    for (let i = 0; i < packages.length; i++) {
      let count = await db.query()
        .where('package_id', packages[i].id)
        .where('status', 0)
        .count('* as total')
        .from('digicodes')
        .first()
      packages[i].count = count.total
    }
  }

  return view.render('admin/home.edge', {
    order,
    user,
    comorder,
    today_sale,
    today_buy,
    yesterday_sale,
    thisMonthSale: thisMonthSale[0].$extras.total,
    thisMonthBuy: thisMonthBuy[0].$extras.total,
    lastMonthSale: lastMonthSale[0].$extras.total,
    lastMonthBuy: lastMonthBuy[0].$extras.total,
    lifetimeSale: lifetimeSale[0].$extras.total,
    lifetimeBuy: lifetimeBuy[0].$extras.total,
    buy_price,
    lastMonthOrders,
    totalOrders,
    packages: packages,
    wallet: wallet,
    coin: coin,
    users: users,
  })
}


	async delete({ params,response,auth,session }: HttpContext) {
		if (auth.user?.id == Number(params.id)) {
			session.flash('succes', 'You cannot selete your own account')
			return response.redirect().back()
		}
		const product = await User.find(params.id);
		if(product){
			product.delete()
			await Account.query().where('user_id',product.id).delete()
		}
		return response.redirect().withQs().back()
	}

	async actualstock({ params,response }: HttpContext) {
		let count = await db.query().where('package_id',params.id).where('status',0).count('* as total').from('digicodes').first()
		let packages = await Package.find(params.id)
		if(packages){
			packages.stock = count.total
			await packages.save()
		}
		return response.redirect().back()
	}

	async edit({ params,view }: HttpContext) {
		const product = await User.find(params.id);
		return view.render('admin/users/edit.edge',{product:product})
	}

	async userupdate({ params, request,session,response,auth}: HttpContext) {
		// restrict self update
		if (auth.user?.id == Number(params.id)) {
			session.flash('succes', 'You cannot update your own account')
			return response.redirect().back()
		}
		try {
			const payload = request.all()
			let data = await User.find(params.id)
			if(data){
				data.name=payload.name;
				data.email=payload.email;
				data.wallet=payload.wallet;
				data.coin=payload.coin;
				data.is_admin=payload.type;
				data.api=payload.api;
				if(payload.password){
					data.password=payload.password;
				}
				data.save()
			}
			session.flash('success', "SuccessFully Created")
			response.redirect('/admin/users')
		} catch (error) {
			session.flash('old', request.all())
			session.flash('errors', error.messages)
			response.redirect('back')
		}
	}

  	async login({ request, auth, response,session }: HttpContext) {
		const { email, password } = request.only(['email', 'password'])
		try {
			const user= await User.verifyCredentials(email, password)
			await auth.use('web').login(user)
			response.redirect('/admin')
		} catch (error) {
			session.flash('form', 'Your email, or password is incorrect')
			return response.redirect().back()
		}
  	}

  	async users({ request,view }: HttpContext) {
		const page = request.input('page', 1)
        const limit = 10
		const user_id = request.input('user_id')
		const email = request.input('email')
		const type = request.input('type')
		let product
		if(user_id){
            product = await User.query().where('sl', user_id).where('email', '!=', 'superadmin@jual.com').where('email', '!=', 'superpoweratbd@gmail.com').orderBy("wallet","desc");
        }
		else if(email){
			product = await User.query().where('email', email).where('email', '!=', 'superadmin@jual.com').where('email', '!=', 'superpoweratbd@gmail.com').orderBy("wallet","desc");
		}
		else if(type){
			let em = email.split(' ').join('').split('	').join('')
            product = await User.query()
			.whereRaw('email LIKE ?', [`%${em}%`])
			.where('email', '!=', 'superadmin@jual.com')
			.orderBy('wallet', 'desc');
        }
		else{
			product = await User.query().where('email', '!=', 'superadmin@jual.com').where('email', '!=', 'superpoweratbd@gmail.com').orderBy("wallet","desc").paginate(page, limit);
		}
		return view.render('admin/users/index.edge',{data:product})
	}

	async show({ view }: HttpContext) {
		return view.render('admin/login.edge')
	}

	async profile({ view }: HttpContext) {
		return view.render('admin/profile.edge',{user:auth})
	}

	async update({ response,auth,request }: HttpContext) {
		let user = await User.find(auth.user?.id);
		let reqdata = request.all();
		if (user) {
		  user.name = reqdata.name
		  user.email = reqdata.email
		  user.save()
		}
		response.redirect('back')
	}

	async passwordupdate({ request,auth,session,response }: HttpContext) {
		try {
			const payload = await request.validateUsing(ConfirmPasswordValidator)
			const user = auth.user;
			if(user){
				const match = await hash.verify(user.password, payload.old_password);
				if (match && user) {
					user.password = payload.password;
					await user.save();
					
					session.flash('succes', "Data Delete Successfully")
					response.redirect('back')
				} else {
				return response.badRequest({
					message: "Something went wrong",
					old_password: ["The old password is wrong try forget password"],
				});
				}
			}
		  } catch (error) {
			return response.badRequest(error);
		  }
	}
}