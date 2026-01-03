import Order from '#models/order';
import Package from '#models/package';
import User from '#models/user';
import Digicode from '#models/digicode';
import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import axios from "axios";
import Product from '#models/product';
import { DateTime } from 'luxon'
export default class OrdersController {

    queryParamsToString(queryParams:any) {
        let queryString = '';
        for (let key in queryParams) {
          if (queryParams[key] && key != 'page') {
            queryString += `&${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`;
          }
        }
        return queryString;
    }

    async delete({params,response}: HttpContext) {
        let order = await Order.find(params.id);
        if(order){
            order.delete();
        }
        return response.redirect().back()
    }

    async index({ request, view }: HttpContext) {
        const query = request.qs();
        let data = this.queryParamsToString(query);
        const page = request.input('page', 1);
        const limit = 10;
        const order_id = request.input('order_id');
        const start_date = request.input('start_date');
        const end_date = request.input('end_date');
        const user_id = request.input('user_id');
        const info = request.input('info');
        const status = request.input('status');

        let productQuery = Order.query().where('payment', 'complete').whereNotNull('product_id');

        if (order_id) {
            productQuery = productQuery.where('id', order_id);
        }if (user_id) {
            let user = await User.findBy('sl', user_id);
            if (user) {
                productQuery = productQuery.where('user_id', user.id);
            }else{
                productQuery = productQuery.where('user_id', 1);
            }
        }if (status) {
            productQuery = productQuery.where('status', status);
        }if (info) {
            productQuery = productQuery.whereRaw("info LIKE ? COLLATE utf8mb4_bin", ['%' + info + '%']);
        }if (start_date && end_date) {
            const startUtc = DateTime.fromISO(start_date, { zone: 'Asia/Dhaka' })
                .startOf('day')
                .toUTC()
                .toFormat('yyyy-MM-dd HH:mm:ss');

            const endUtc = DateTime.fromISO(end_date, { zone: 'Asia/Dhaka' })
                .endOf('day')
                .toUTC()
                .toFormat('yyyy-MM-dd HH:mm:ss');

            productQuery = productQuery
                .where('created_at', '>=', startUtc)
                .where('created_at', '<=', endUtc);
        } else if (start_date) {
            const startUtc = DateTime.fromISO(start_date, { zone: 'Asia/Dhaka' })
                .startOf('day')
                .toUTC()
                .toFormat('yyyy-MM-dd HH:mm:ss');

            productQuery = productQuery.where('created_at', '>=', startUtc);
        } else if (end_date) {
            const endUtc = DateTime.fromISO(end_date, { zone: 'Asia/Dhaka' })
                .endOf('day')
                .toUTC()
                .toFormat('yyyy-MM-dd HH:mm:ss');

            productQuery = productQuery.where('created_at', '<=', endUtc);
        }

        // Fetch paginated orders
        const product = await productQuery.clone().orderBy('id', 'desc').preload('digicodes').preload('user').paginate(page, limit);

        // Calculate total buy_price and sale_price across all matching orders
        const totalStats = await productQuery.clone().select('buy_price', 'sale_price').exec();

        // Sum up the prices
        let totalBuyPrice = 0;
        let totalSalePrice = 0;

        totalStats.forEach(order => {
            totalBuyPrice += order.buy_price;
            totalSalePrice += order.sale_price;
        });

        return view.render('admin/orders/index.edge', {
            data: product,
            query: data,
            totalBuyPrice: totalBuyPrice,
            totalSalePrice: totalSalePrice
        });
    }

    async botbuynow({ request, response }: HttpContext) {
        let headerApi = request.header('RT-UDDOKTAPAY-API-KEY')

        if (headerApi != env.get('UDDOKTAPAY_API_KEY')) {
        return response.send('Unauthorized Action')
        }

        try {
            const payload = request.all()

            if (payload.quantity) {
                payload.quantity = parseInt(payload.quantity)
            }

            const user = await User.find('cm9749rh6000rfj51jwft18ta')
            let packages = null
            if (payload.variation_id != null) {
                packages = await Package.find(payload.variation_id)
            }
            let order = new Order()
            if (user && packages) {
                let buy_price = 0
                let sale_price = 0
                if (payload.quantity && payload.quantity > packages.stock) {
                    return response.redirect('back')
                }
                if (payload.quantity && Number.isInteger(payload.quantity) && payload.quantity > 0) {
                    order.qty = payload.quantity
                    buy_price = packages.buy_price * payload.quantity
                    sale_price = (packages.sale_price + packages.extra_fee) * payload.quantity
                } else {
                    buy_price = packages.buy_price
                    order.qty = 1
                    sale_price = packages.sale_price + packages.extra_fee
                }

                var a = {
                    player_id: payload.player_id,
                    order_id: payload.order_id,
                    url: payload.url,
                }

                order.user_id = user.id
                order.package_id = packages.id
                order.product_id = packages.product_id
                order.package_name = packages.name
                order.buy_price = buy_price
                order.count = 0
                order.sale_price = sale_price
                order.info = JSON.stringify(a)
                order.status = 'pending'
                order.payment = 'pending'
                order.createdAt = DateTime.now().minus({ hours: 6 })
                order.updatedAt = DateTime.now().minus({ hours: 6 })
                await order.save()
                if (payload.payment_method == 'wallet' && user.wallet >= sale_price) {
                    order.payment = 'complete'
                    user.wallet = user.wallet - sale_price
                    await user.save()
                    order.save()
                    if (packages.is_auto) {
                        this.autoorder(order, packages, payload.quantity)
                    }
                }
            } else {
                return response.badRequest('Package not found')
            }
            return response.send('Order Place SuccessFully')
        } catch (error) {
        return response.badRequest(error)
        }
    }

    async resend({params,response}: HttpContext) {
        let order = await Order.find(params.id);
        if(order){
            let packages = await Package.find(order.package_id);
            if(packages){
                let digicodes = await Digicode.query().where('order_id',order.id);
                let relativeUnipinIds = JSON.parse(packages.relative_unipin_ids);
                if(relativeUnipinIds.length == digicodes.length){
                    for (const digicode of digicodes) {
                        const giftpackage = await Package.find(digicode.package_id);
                        this.callBotServer(order,giftpackage,digicode.code)
                    }
                }else{
                    for (const id of relativeUnipinIds) {
                        let giftvoucher = await Package.find(parseInt(id));
                        if(giftvoucher && giftvoucher.is_hide && giftvoucher.shelltype){
                            let shelltype = await Shelltype.find(giftvoucher.shelltype);
                            let rdata: any = {};
                            if (shelltype?.selfstock && shelltype?.username!=null && shelltype?.password!=null && shelltype?.autocode!=null && shelltype?.tgbotid!=null) {
                                rdata.username = shelltype.username
                                rdata.password = shelltype.password
                                rdata.autocode = shelltype.autocode
                                rdata.tgbotid = shelltype.tgbotid
                                rdata.shell_balance = shelltype.shell_balance
                            }
                            console.log('shelltype',shelltype)
                            this.callBotServer(order,giftvoucher,shelltype?.name,rdata)
                        }
                        else if (giftvoucher) {
                            let pack = await Digicode.query().where('package_id',giftvoucher.id).where('order_id',order.id).first();
                            if(pack){
                                console.log('Already Sent')
                               continue
                            }
                            let digicode = await Digicode.query()
                                .where("package_id", giftvoucher.id)
                                .where("status", 0)
                                .first();
                            if (digicode) {
                                digicode.status = 1;
                                digicode.orderId = order.id;
                                await digicode.save();
                                let code = digicode.code;
                                giftvoucher.stock = giftvoucher.stock - 1;
                                await giftvoucher.save();
                                if (code.length > 2) {
                                    this.callBotServer(order,giftvoucher,code)
                                }
                            }
                        }
                    }
                }
            }
            order.status='pending';
            order.save();
        }
        return response.redirect().back()
    }

    async callBotServer(order:any,packages:any,code:any,shellinfo:any=null) {
        console.log('callBotServer',shellinfo)
        const CLIENT_URL = env.get("CLIENT_URL") || "http://localhost:3333";
        const url = new URL(CLIENT_URL);
        const parts = url.hostname.split('.');
        const rootDomain = parts.slice(-2).join('.');
        const baseUrl = `${url.protocol}//${rootDomain}`;
        let rdata :any = {
            playerid: JSON.parse(order.info).player_id,
            pacakge: packages.tag_line,
            code: code,
            orderid: order.id,
            url: baseUrl+'/api/completeorder/'+env.get("BOT_API_KEY"),
        };
        if(shellinfo?.username && shellinfo?.password && shellinfo?.autocode && shellinfo?.tgbotid) {
            rdata.username = shellinfo.username;
            rdata.password = shellinfo.password;
            rdata.autocode = shellinfo.autocode;
            rdata.tgbotid = shellinfo.tgbotid;
            rdata.shell_balance = shellinfo.shell_balance;
        }
        let aaaa = "demo_server";
        aaaa = order.server;
        if(aaaa)axios.post(aaaa, rdata);

    }

    async autoorder(order:any,packages:any,quantity=1) {
        if(Number.isInteger(quantity) && quantity>0){
            let product = await Product.find(order.product_id);
            let packagess = await Package.find(packages.id)
            if (product && product.type==2 ) {
                const digicodes = await Digicode.query()
                .where("package_id", packages.id)
                .where("status", 0)
                .orderBy("id", "desc")
                .limit(quantity);
                if(packages.stock < order.qty){
                    const user = await User.findOrFail(order.user_id)
                    user.wallet = user.wallet + order.sale_price;
                    await user.save()

                    order.payment = 'refound'
                    order.status = 'cancel'
                    await order.save()
                    return "Your selected stock is not available. Available stock ";
                }

                if (digicodes) {
                    for (const digicode of digicodes) {
                        digicode.status = 1;
                        digicode.orderId = order.id;
                        await digicode.save();
                    }
                }

                if(packagess){
                    packagess.stock-=quantity;
                    await packagess.save();
                }
                order.status = 'complete'
                await order.save()
            }else{
                let orders = await Order.find(order.id);
                if(orders && packagess && packagess.relative_unipin_ids && packagess.relative_unipin_ids.length>0 ){

                    let server = null;

                    if (packagess.is_auto && packagess.server=="no") {
                        server = await this.getActiveServer()
                    }else if (packagess.is_auto) {
                        server = packagess.server;
                    }

                    orders.server= server ? server : 'noserver';
                    orders.save()
                    var ppp = "";
                    var code: any = "";
                    var digicode: any = [];

                    let pack = JSON.parse(packagess.relative_unipin_ids);

                    for (const id of pack) {
                        let giftvoucher = await Package.find(parseInt(id));
                        if (giftvoucher) {
                            digicode = await Digicode.query()
                                .where("package_id", giftvoucher.id)
                                .where("status", 0)
                                .first();

                            if (digicode) {
                                digicode.status = 1;
                                digicode.orderId = orders.id;
                                await digicode.save();
                                code = digicode.code;
                                ppp = giftvoucher.tag_line;
                                giftvoucher.stock = giftvoucher.stock - 1;
                                await giftvoucher.save();
                            }

                            if (giftvoucher.is_hide == 1) {
                                code = "shell";
                                ppp = giftvoucher.tag_line;
                            }

                            if (code.length > 2) {
                                let rdata:any = {
                                    playerid: JSON.parse(orders.info).player_id,
                                    pacakge: ppp,
                                    code: code,
                                    orderid: orders.id,
                                    url: env.get("CLIENT_URL")+'/completeorder/'+env.get("BOT_API_KEY"),
                                };
                                let shelltype = await Shelltype.find(giftvoucher.shelltype);
                                 if (giftvoucher.is_hide == 1 && shelltype && shelltype.selfstock==1) {
                                    rdata.username = shelltype.username;
                                    rdata.password = shelltype.password;
                                    rdata.autocode = shelltype.autocode;
                                    rdata.tgbotid = shelltype.tgbotid;
                                    rdata.shell_balance = shelltype.shell_balance;
                                 }

                                let aaaa = "demo_server";
                                aaaa = orders.server;
                                axios.post(aaaa, rdata);
                            }
                            else{
                                orders.status='looking';
                                await orders.save();
                            }
                        }
                    }

                }
            }
        }
    }

    async update({params,response,request,auth}: HttpContext) {
        let order = await Order.find(params.id);
        let editor_id:any = 0
        if(auth.user){
            editor_id = auth.user.id
        }
       if(order && (order.status=='pending' || order.status=='looking' ) && request.input('status')=='cancel'){
            order.editor_id=editor_id;
            order.status='cancel';
            order.comment_id=request.input('comment_id');
            await order.save()
            let user = await User.find(order.user_id)
            if(user){
                var datasssss = JSON.parse(order.info)
                if(datasssss.is_auto && datasssss.is_coin==1){
                    user.earn_wallet = user.earn_wallet+order.sale_price;
                }else{
                    user.wallet = user.wallet+order.sale_price;
                }
                await user.save()
            }
            let pacakge = await Package.find(order.package_id);
            if(pacakge){
                // && user.refer_id
                if(user && pacakge.coin>0){
                    user.coin=user.coin-pacakge.coin;
                    await user.save()
                    let coins = new Coin()
                    coins.user_id = user.id
                    coins.coin = pacakge.coin
                    coins.purpass = "OrderCancel"
                    coins.type = '-'
                    await coins.save()
                }
                await this.refoundandrestock(order,'content')
            }
            return response.redirect().withQs().back()
        }else if(order){
            order.content=request.input('content');
            order.status='complete';
            order.editor_id=editor_id;
            await order.save()
            return response.redirect().withQs().back()
        }
    }

    async completeorder({ request , params}: HttpContext) {
        const status = request.input("status");
        const orderid = request.input("orderid");
        const content = request.input("content");
        let order = await Order.find(orderid);
        console.log(status)
        if (order) {
            // @ts-ignore
            order.transaction_id = Number(order.transaction_id || 0) + 1;
            await order.save();
        }

        if(order && status == "success"){
            order.count=Number(order.count)+1;
            const code = request.input("code")
            if (code) {
              const shelltype = await Shelltype.query().where("name", code).first()
              if (shelltype) {
                shelltype.shell_balance -= Number(request.input("content")) || 0
                await shelltype.save()
                order.comment_id = order.comment_id + Number(request.input("content"))
              }
            }
            await order.save();
        }

        if(status=='success' && order && order.status!='looking'){
            order.status = 'complete'
            await order.save()
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            var datasssss = JSON.parse(order.info)
            if(datasssss && datasssss.url && datasssss.order_id){
                if(datasssss.url=='telegram'){
                    const playerName = request.input('nickname') || 'N/A';
                    const productName = datasssss.product || 'N/A';
                    const quantity = datasssss.quantity || 1;
                    const deducted = datasssss.amount || '0.00';
                    const newBalance = datasssss.balance || '0.00';

                    const startTime = order.createdAt; 
                    const endTime = DateTime.now();
                    // @ts-ignore
                    const durationSeconds = endTime.diff(startTime, 'seconds').toObject().seconds.toFixed(2);
                    const time = endTime.setZone('Asia/Dhaka').toFormat('f');
                    const message = [
                        `🎉<b>Top-up Successful!</b></b></b>`,
                        `<b>Player:</b> ${playerName}`,
                        `<b>Product:</b> ${productName}`,
                        `<b>Quantity:</b> ${quantity}`,
                        `<b>Deducted:</b> ${deducted} ${env.get('currency')}`,
                        `<b>Time:</b> ${time} (Sri Lanka)`,
                        `<b>Duration:</b> ${durationSeconds} sec`,
                        `<b>New Balance:</b> ${newBalance} ${env.get('currency')}`
                    ].join('\n');

                    bot.sendMessage(order.user_id, message, { parse_mode: 'HTML' });
                }else if(datasssss.url=='tguserbot' && order.count==order.qty){
                    console.log('tguserbot success')
                    const client = getTelegramClient()
                    const playerName = request.input('nickname') || 'N/A';
                    const user = await User.find(order.user_id)
                    const newBalance = user?.wallet;
                    const startTime = order.createdAt; 
                    const endTime = DateTime.now();
                    // @ts-ignore
                    const durationSeconds = endTime.diff(startTime, 'seconds').toObject().seconds.toFixed(2);
                    const time = endTime.setZone('Asia/Dhaka').toFormat('f');
                    const message = [
                        `🎉<b>Top-up Successful!</b></b></b>`,
                        `<b>Player:</b> ${playerName}`,
                        `<b>Product:</b> ${order.package_name}`,
                        `<b>Quantity:</b> ${order.qty}`,
                        `<b>Deducted:</b> ${order.sale_price} ${env.get('currency')}`,
                        `<b>Time:</b> ${time} (Sri Lanka)`,
                        `<b>Duration:</b> ${durationSeconds} sec`,
                        `<b>New Balance:</b> ${newBalance} ${env.get('currency')}`
                    ].join('\n');
                    await client.sendMessage(order.user_id, {
                        message: message,
                        parseMode: 'html'
                    })
                }
                else{
                    let rdata={
                        order_id:datasssss.order_id,
                        status:'completed',
                        message:'Order successfully processed by bot',
                        api_key:'3a8d74f2c9f649fa8a7e1b2cd3e4f9b2',
                    }
                    axios.post(datasssss.url,rdata,config)
                }
            }
        }else if(order){
            var datasssss = JSON.parse(order.info)
            const user = await User.find(order.user_id)

            if(datasssss.url=='tguserbot' && user && order.count==0){
                let sp = order.sale_price || 0;
                user.wallet = user.wallet + Number(sp);
                await user.save();
            }

            if(datasssss.url=='telegram'){
                const playerName = request.input('nickname') || 'N/A';
                const productName = datasssss.product || 'N/A';
                const quantity = datasssss.quantity || 1;
                const deducted = datasssss.amount || '0.00';
                const newBalance = datasssss.balance || '0.00';

                const startTime = order.createdAt; 
                const endTime = DateTime.now();
                // @ts-ignore
                const durationSeconds = endTime.diff(startTime, 'seconds').toObject().seconds.toFixed(2);
                const time = endTime.setZone('Asia/Dhaka').toFormat('f');

                const message = [
                    `🎉<b>${content}</b>`,
                    `<b>Player:</b> ${playerName}`,
                    `<b>Product:</b> ${productName}`,
                    `<b>Quantity:</b> ${quantity}`,
                    `<b>Deducted:</b> ${deducted} ${env.get('currency')}`,
                    `<b>Time:</b> ${time} (Sri Lanka)`,
                    `<b>Duration:</b> ${durationSeconds} sec`,
                    `<b>New Balance:</b> ${newBalance} ${env.get('currency')}`
                ].join('\n');

                bot.sendMessage(order.user_id, message, { parse_mode: 'HTML' });
            }else if(datasssss.url === 'tguserbot' && Number(order.qty)==Number(order.transaction_id)){
            
                const client = getTelegramClient()
                const playerName = request.input('nickname') || 'N/A';

                if(order.count>0){

                    const user = await User.find(order.user_id)
                    const newBalance = user?.wallet;
                    const startTime = order.createdAt; 
                    const endTime = DateTime.now();
                    // @ts-ignore
                    const durationSeconds = endTime.diff(startTime, 'seconds').toObject().seconds.toFixed(2);
                    const time = endTime.setZone('Asia/Dhaka').toFormat('f');
                    const message = [
                        `🎉<b>Top-up Successful!</b></b></b>`,
                        `<b>Player:</b> ${playerName}`,
                        `<b>Product:</b> ${order.package_name}`,
                        `<b>Quantity:</b> ${order.qty}`,
                        `<b>Deducted:</b> ${order.sale_price} ${env.get('currency')}`,
                        `<b>Time:</b> ${time} (Sri Lanka)`,
                        `<b>Duration:</b> ${durationSeconds} sec`,
                        `<b>New Balance:</b> ${newBalance} ${env.get('currency')}`
                    ].join('\n');
                    await client.sendMessage(order.user_id, {
                        message: message,
                        parseMode: 'html'
                    })

                }

                // refound wallet
                const newBalance = user?.wallet;
                const startTime = order.createdAt; 
                const endTime = DateTime.now();
                // @ts-ignore
                const durationSeconds = endTime.diff(startTime, 'seconds').toObject().seconds.toFixed(2);
                const time = endTime.setZone('Asia/Dhaka').toFormat('f');
                var message:any=[]
                if(content=='region does not match'){
                    message = [
                        `❌ <b>Invalid region – does not match</b>`,
                        `⚠️ Your Free Fire account is not from the <b>Singapore</b> region.`,
                        `Top-ups are only available for <b>Singapore region</b> accounts.`,
                        `Please check your game settings and try again.`,
                    ].join('\n');
                }else if(content=='Invalid Player ID'){
                    
                     message = [
                    `❌ <b>Invalid Player ID</b>`,
                    `⚠️ The Player ID you entered is not valid.`,
                    `Please double-check and enter a correct Free Fire Player ID.`,
                    ].join('\n');
                }
                else if(content=='error_balance'){
                     message = [
                        `❌ <b> The top-up cannot be completed due to insufficient shells in your account</b>`
                     ]
                }else{
                    message = [
                    `🎉<b>${content}</b>`,
                    `<b>Player:</b> ${playerName}`,
                    `<b>Product:</b> ${order.package_name}`,
                    `<b>Quantity:</b> ${order.qty}`,
                    `<b>Deducted:</b> 0 ${env.get('currency')}`,
                    `<b>Time:</b> ${time} (Sri Lanka)`,
                    `<b>Duration:</b> ${durationSeconds} sec`,
                    `<b>New Balance:</b> ${newBalance} ${env.get('currency')}`
                ].join('\n');
                }
                await client.sendMessage(order.user_id, {
                    message: message,
                    parseMode: 'html'
                })
            }

            if(content=='Invalid Player ID' || content=='region does not match'){
                if(order.status!='cancel' && env.get("BOT_API_KEY") && params.id == env.get("BOT_API_KEY")){
                    await this.refoundandrestock(order,content)
                }else{
                    order.status = 'looking';
                    order.content = content;
                    order.save();
                }
            }else{
                order.content = content;
                order.status = 'looking'
                await order.save()
            }
        }

        if(order && Number(order.qty)==Number(order.transaction_id) && order.qty!=order.count){

            const client = getTelegramClient()
            const playerName = request.input('nickname') || 'N/A';
            const user = await User.find(order.user_id)
            if(order.count>0){

                const newBalance = user?.wallet;
                const startTime = order.createdAt; 
                const endTime = DateTime.now();
                // @ts-ignore
                const durationSeconds = endTime.diff(startTime, 'seconds').toObject().seconds.toFixed(2);
                const time = endTime.setZone('Asia/Dhaka').toFormat('f');
                const message = [
                    `🎉<b>Top-up Successful!</b></b></b>`,
                    `<b>Player:</b> ${playerName}`,
                    `<b>Product:</b> ${order.package_name}`,
                    `<b>Quantity:</b> ${order.qty}`,
                    `<b>Deducted:</b> ${order.sale_price} ${env.get('currency')}`,
                    `<b>Time:</b> ${time} (Sri Lanka)`,
                    `<b>Duration:</b> ${durationSeconds} sec`,
                    `<b>New Balance:</b> ${newBalance} ${env.get('currency')}`
                ].join('\n');
                await client.sendMessage(order.user_id, {
                    message: message,
                    parseMode: 'html'
                })

            }

            // refound wallet
            const newBalance = user?.wallet;
            const startTime = order.createdAt; 
            const endTime = DateTime.now();
            // @ts-ignore
            const durationSeconds = endTime.diff(startTime, 'seconds').toObject().seconds.toFixed(2);
            const time = endTime.setZone('Asia/Dhaka').toFormat('f');
            var message:any=[]
            if(content=='region does not match'){
                message = [
                    `❌ <b>Invalid region – does not match</b>`,
                    `⚠️ Your Free Fire account is not from the <b>Singapore</b> region.`,
                    `Top-ups are only available for <b>Singapore region</b> accounts.`,
                    `Please check your game settings and try again.`,
                ].join('\n');
            }else if(content=='Invalid Player ID'){
                
                    message = [
                `❌ <b>Invalid Player ID</b>`,
                `⚠️ The Player ID you entered is not valid.`,
                `Please double-check and enter a correct Free Fire Player ID.`,
                ].join('\n');
            }
            else if(content=='error_balance'){
                    message = [
                    `❌ <b> The top-up cannot be completed due to insufficient shells in your account</b>`
                    ]
            }else{
                message = [
                `🎉<b>${content}</b>`,
                `<b>Player:</b> ${playerName}`,
                `<b>Product:</b> ${order.package_name}`,
                `<b>Quantity:</b> ${order.qty}`,
                `<b>Deducted:</b> 0 ${env.get('currency')}`,
                `<b>Time:</b> ${time} (Sri Lanka)`,
                `<b>Duration:</b> ${durationSeconds} sec`,
                `<b>New Balance:</b> ${newBalance} ${env.get('currency')}`
            ].join('\n');
            }
            await client.sendMessage(order.user_id, {
                message: message,
                parseMode: 'html'
            })

        }
    }

    async getActiveServer() {
        let autoServer = await AutoServer.query()
          .where('status', 'active')
          .where('availability', 'idle')
          .first();

        if (!autoServer) {
          const allAutoServer = await AutoServer.query().where('status', 'active')

          if (allAutoServer.length === 0) {
            return 'No active servers found';
          }

          for (const server of allAutoServer) {
            server.availability = 'idle';
            await server.save();
          }

          autoServer = allAutoServer[0];
        }

        autoServer.availability = 'on_task';
        await autoServer.save();
        return autoServer.link;
    }

    async refoundandrestock(order:any,content:any) {
        order.status = 'cancel';
        order.content = content;
        order.save();
        // let user = await User.find(order.user_id);
        // if(user){
        //     user.wallet = user.wallet + order.sale_price;
        //     await user.save();
        // }

        let digicode = await Digicode.query().where("orderId", order.id)
        if(digicode){
            for(let i = 0;i<digicode.length;i++){
                let digi = await Digicode.find(digicode[i].id);
                if(digi){
                    digi.status = 0;
                    digi.orderId = null;
                    await digi.save();
                }
                let giftvoucher = await Package.find(digicode[i].package_id);
                if(giftvoucher){
                    giftvoucher.stock = giftvoucher.stock + 1;
                    await giftvoucher.save();
                }
            }
        }
    }
}
