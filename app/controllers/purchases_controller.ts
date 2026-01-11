import type { HttpContext } from '@adonisjs/core/http'
import Purchase from '#models/purchase'
import Product from '#models/product'
import Package from '#models/package'
import Digicode from '#models/digicode'
import Banar from '#models/banar'
import axios from "axios";
import qs from "qs";
import CryptoJS from "crypto-js";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { authenticator } from "otplib";
import { HttpsProxyAgent } from 'https-proxy-agent';
import env from '#start/env'

const proxyAgent = new HttpsProxyAgent(env.get('PROXY') || ''); 
// Cookie jar for session management
const jar = new CookieJar();
const cookieJar = new CookieJar();
const client = wrapper(
    axios.create({
        jar,
        withCredentials: true,
        timeout: 30000,
        validateStatus: () => true,
    })
);

const defaultOptions:any = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Priority': 'high'
    }
};

if(env.get('PROXY_ENABLED')){
    defaultOptions.httpsAgent = proxyAgent
}


// Session cache
let cachedSession = {
    ssoToken: null,
    uuid: null,
    otpTokenEnc: null,
    createdAt: 0,
    useCount: 0
};

function pick(xml: string, tag: string) {
    const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
    return m ? m[1].trim() : null;
}

function parseRazerCopLoginXml(xml: string) {
    const errno = Number(pick(xml, "Errno") || 0);
    const message = pick(xml, "Message");
    const uuid = pick(xml, "ID");
    const token = pick(xml, "Token");
    const ts = Number(pick(xml, "Timestamp") || 0);
    const server = pick(xml, "Server");
    return { ok: errno > 0 && !!uuid && !!token, errno, message, uuid, token, ts, server, raw: xml };
}

function buildCopXmlRev1({ email, passPlain, serviceCode, difTime = 0 }: any) {
    const copNoPw = {
        COP: {
            User: { email },
            ServiceCode: String(serviceCode),
        },
    };
    const passphrase = JSON.stringify(copNoPw);
    const ts = Math.round((Date.now() + difTime) / 1000);
    const plain = `${passPlain}|rzrpw_u4dNqrv|${ts}`;
    const encrypted = CryptoJS.AES.encrypt(plain, passphrase).toString();

    const xml =
        `<COP><User><email>${email}</email><password>${encrypted}</password></User>` +
        `<ServiceCode>${serviceCode}</ServiceCode></COP>`;

    return { xml, encrypted, plain, passphrase, ts };
}

function short(obj: any, max = 400) {
    try {
        const s = typeof obj === "string" ? obj : JSON.stringify(obj);
        return s.length > max ? s.slice(0, max) + "…(cut)" : s;
    } catch {
        return String(obj);
    }
}

function makeStepError(step: string, err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const msg = err?.message || String(err);
    const detail =
        status ? `status=${status} body=${short(data)}` : `no-response`;
    return new Error(`[${step}] ${msg} | ${detail}`);
}

async function runStep(stepName: string, fn: Function) {
    try {
        const out = await fn();
        return out;
    } catch (err) {
        const e = makeStepError(stepName, err);
        throw e;
    }
}

async function getRazerTOTP(secret: string) {
    return authenticator.generate(secret);
}

function wait(ms:any) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default class PurchasesController {
    async index({ view, request }: HttpContext) {
        const page = request.input('page', 1)
        const limit = 10
        const product = await Purchase.query().preload('package').preload('banar').orderBy('id', 'desc').paginate(page, limit);
        const prod = await Product.all();
        const brand = await Banar.all();
        return view.render('admin/purchase/index.edge', { data: product, prod: prod, brand: brand })
    }

    async use({ params, response }: HttpContext) {
        let digicode = await Digicode.find(params.id);
        if (digicode && digicode.status == 0) {
            digicode.status = 1;
            await digicode.save()
            let pa = await Package.find(digicode.package_id);
            if (pa) {
                pa.stock = pa.stock - 1;
                await pa.save()
            }
        }
        return response.redirect('back')
    }

    async store({ request, response }: HttpContext) {
        try {
            const { qty, account_id, package_id } = request.all();

            if (qty > 0) {
                const packages = await Package.find(package_id);
                const banar = await Banar.find(account_id);

                if (packages) {
                    // Create purchase record
                    const purchase = await Purchase.create({
                        package_id: packages.id,
                        qty,
                        status:'running',
                        count:0,
                        account_id:account_id,
                    });

                    // Define Razer API config
                    const config = {
                        email: banar?.email,
                        passPlain: banar?.password,
                        secretTotp: banar?.key,
                        product: packages.coin, // You can map this from your package or product
                        count: qty, // Use the qty from request
                        delayBetweenOrders: 0,
                        purchase,
                        packages
                    };

                    this.runMultipleOrders(config);
                  
                }

                return response.redirect('back');
            }
        } catch (error) {
            console.error(error);
            return response.status(500).send('An error occurred while processing the request.');
        }
    }

    async show({ params }: HttpContext) {
        let packages = await Package.query().where('product_id', params.id)
        return packages
    }

    async edit({ params, view }: HttpContext) {
        let packages = await Digicode.query().where('purchase_id', params.id).where('status', 1)
        return view.render('admin/purchase/views.edge', { data: packages })
    }

    async deletevoucher({ params, response }: HttpContext) {
        const asas = await Digicode.query().where('purchase_id', params.id);
        await Digicode.query().where('purchase_id', params.id).delete();
        const purchase = await Purchase.find(params.id);
        if (purchase && asas) {
            const packages = await Package.find(purchase.package_id);
            if (packages) {
                packages.stock = packages.stock - purchase.qty
                await packages.save();
            }
            await purchase.delete()
        }
        return response.redirect('back')
    }

    // In PurchasesController
    async startOrder({ params, response }: HttpContext) {
        try {
            const purchase = await Purchase.find(params.id);
            if (!purchase) {
                return response.status(404).json({ 
                    success: false, 
                    message: 'Purchase not found' 
                });
            }

            purchase.count=0;
            purchase.status = 'running';
            await purchase.save();
            
            // Get package and account details
            const packages = await Package.find(purchase.package_id);
            const brand = await Banar.find(purchase.account_id); // Assuming you store account_id
            
            if (!packages) {
                throw new Error('Package not found');
            }
            
            // Define Razer API config
            // Note: You should store credentials in Banar model or separate config
            const config = {
                email: brand?.email ,
                passPlain: brand?.password ,
                secretTotp: brand?.key ,
                product: packages.coin,
                count: purchase.qty, // Use the qty from request
                delayBetweenOrders: 0,
                purchase,
                packages
            };
            
            // Run orders in background (consider using a queue for better performance)
            this.runMultipleOrders(config).then(async (orderResults) => {
                // Update purchase status based on results
                if (orderResults.errors.length === 0) {
                    purchase.status = 'completed';
                } else if (orderResults.results.length > 0) {
                    purchase.status = 'partially_completed';
                } else {
                    purchase.status = 'failed';
                }
                
                // Save digicodes
                if (orderResults.results && orderResults.results.length > 0) {
                    for (const result of orderResults.results) {
                        if (result.pin) {
                            await Digicode.create({
                                purchase_id: purchase.id,
                                package_id: packages.id,
                                code: result.pin,
                                status: 0
                            });
                        }
                    }
                }
                
                await purchase.save();
            }).catch(async (error) => {
                console.error('Order processing error:', error);
                purchase.status = 'failed';
                purchase.cmt = error.message;
                await purchase.save();
            });
            
            return response.redirect('back');
            
        } catch (error) {
            console.error(error);
            return response.status(500).json({ 
                success: false, 
                message: 'An error occurred while starting the order process' 
            });
        }
    }


    async razarlogin({ email, passPlain }: any) {
        console.log(`Logging in with email: ${email}`);
             const serviceCode = "0770";
        const clientId = "63c74d17e027dc11f642146bfeeaee09c3ce23d8";
        const difTime = 0;
        try { jar.removeAllCookiesSync(); } catch (e) { }

        const { xml } = buildCopXmlRev1({ email, passPlain, serviceCode, difTime });

        const requestOptions:any = { ...defaultOptions };

        const cookies = await cookieJar.getCookieString('https://razerid.razer.com/api/emily/7/login/get');
        if (cookies) {
            requestOptions.headers= {
                ...requestOptions.headers,
                'Cookie': cookies
            };
        }

        const loginRes = await runStep("COP_LOGIN", async () => {
            const res = await axios.post(
                "https://razerid.razer.com/api/emily/7/login/get",
                { data: xml, encryptedPw: "rev1", clientId },
                requestOptions
            );
            const loginXml = typeof res.data === "string" ? res.data : (res.data?.data || "");
            const parsed = parseRazerCopLoginXml(loginXml);
            if (!parsed.ok) throw new Error(`Login failed: errno=${parsed.errno} msg=${parsed.message || "-"}`);
            return { parsed, raw: loginXml };
        });

        const { parsed } = loginRes;
        return parsed
    }

    async getFreshSession({ uuid, token, secretTotp }: any) {
        console.log('🔄 Getting fresh session...');
        const clientId = "63c74d17e027dc11f642146bfeeaee09c3ce23d8";
        await wait(2000);   
        // Clear cookies
        
        // let accountSummary = await this.getAccountSummary(parsed.token!, parsed.uuid!);
        // console.log('Account Summary during session creation:', accountSummary);
        const requestOptions:any = { ...defaultOptions };
        await runStep("LOGIN_SSO", async () => {
            const ssoBody = qs.stringify({
                grant_type: "password",
                client_id: clientId,
                scope: "sso cop",
                uuid: uuid,
                token: token,
            });
            const res = await client.post("https://oauth2.razer.com/services/login_sso", ssoBody, {
                headers: { "content-type": "application/x-www-form-urlencoded", "accept": "application/json, text/plain, */*", "referer": "https://razerid.razer.com/" }
            });
            if (res.status >= 400) throw new Error(`login_sso http ${res.status}`);
            if (res.data?.message !== "login_successful") throw new Error(`login_sso unexpected body: ${short(res.data)}`);
            return res.data;
        });

        const ssoRes = await runStep("SSO_TOKEN_FOR_OTP", async () => {
            const res = await client.post("https://oauth2.razer.com/services/sso", qs.stringify({
                client_id: clientId,
                client_key: "enZhdWx0",
                scope: "sso cop",
            }), {
                headers: { "content-type": "application/x-www-form-urlencoded", "accept": "application/json, text/plain, */*", "referer": "https://razerid.razer.com", "origin": "https://razerid.razer.com" }
            });
            if (res.status >= 400) throw new Error(`sso http ${res.status}`);
            if (!res.data?.access_token) throw new Error(`no access_token from sso: ${short(res.data)}`);
            return res.data;
        });

        await runStep("OPEN_OTP_PAGE", async () => {
            const res = await axios.get(`https://razerid.razer.com/otp?container=1&theme=dark&l=en&client_id=${clientId}&webauthn=1&iframe=1`, 
                requestOptions
            );
            if (res.status >= 400) throw new Error(`otp page http ${res.status}`);
            return true;
        });

        const tokenTotp = await runStep("GENERATE_TOTP", async () => {
            const token = await getRazerTOTP(secretTotp);
            if (!token || String(token).length < 6) throw new Error("invalid TOTP generated");
            return String(token);
        });

        const totpPost = await runStep("SUBMIT_TOTP", async () => {
            const res = await client.post("https://razer-otptoken-service.razer.com/totp/post", { client_id: clientId, token: tokenTotp }, {
                headers: {
                    "content-type": "application/json",
                    "accept": "application/json, text/plain",
                    "authorization": `Bearer ${ssoRes.access_token}`,
                    "referer": "https://razerid.razer.com/",
                    "origin": "https://razerid.razer.com",
                }
            });
            if (res.status >= 400) throw new Error(`totp/post http ${res.status}`);
            if (!res.data?.otp_token_enc) throw new Error(`no otp_token_enc: ${short(res.data)}`);
            return res.data;
        });

        // Cache the session
        cachedSession = {
            ssoToken: ssoRes.access_token,
            uuid: uuid!,
            otpTokenEnc: totpPost.otp_token_enc,
            createdAt: Date.now(),
            useCount: 0
        };

        console.log('✅ Fresh session created');
        return cachedSession;
    }

    async orderRazer({ email, secretTotp, product, orderNumber = 1, useCachedSession = true,purchase ,packages,uuid,token}: any) {
        console.log(`\n📦 Starting Order #${orderNumber}`);

        const productId = product;
        if (!productId) throw new Error(`Invalid product amount: ${product}`);

        // Clear cookies for each order
        try { jar.removeAllCookiesSync(); } catch (e) { }

        // Get or refresh session
        let session = cachedSession;
        const now = Date.now();
        const sessionAge = now - cachedSession.createdAt;
        const sessionExpired = !cachedSession.otpTokenEnc ||
            cachedSession.useCount >= 50 ||
            sessionAge > 27000; // 25 seconds max

        if (!useCachedSession || sessionExpired) {
            session = await this.getFreshSession({ uuid, token, secretTotp });
        }

        // Increment use count
        cachedSession.useCount++;

        await client.get("https://gold.razer.com/global/en/gold/catalog/freefire-pins", {
            headers: { "accept": "text/html,application/xhtml+xml,application/xml;q=0.9;q=0.8", "referer": "https://gold.razer.com/" }
        });

        const checkoutRes = await runStep("CHECKOUT", async () => {
            const bodyCheckout = {
                productId,
                regionId: 2,
                paymentChannelId: 1,
                emailIsRequired: true,
                permalink: packages.tag_line,
                otpToken: session.otpTokenEnc,  // Use cached otp_token_enc
                savePurchaseDetails: true,
                personalizedInfo: [],
                email,
            };
            const res = await client.post("https://gold.razer.com/api/webshop/checkout/gold", bodyCheckout, {
                headers: {
                    "content-type": "application/json",
                    "origin": "https://gold.razer.com",
                    "referer": "https://gold.razer.com/global/en/gold/catalog/freefire-pins",
                    "x-razer-accesstoken": session.ssoToken,
                    "x-razer-fpid": "f0a85a0979c72ff5ea4ab88d9ec6a88f",
                    "x-razer-language": "en",
                    "x-razer-razerid": session.uuid,
                }
            });
            console.log(`🛒 Order #${orderNumber} checkout response:`, short(res.data));
            if (res.status >= 400) throw new Error(`checkout http ${res.status}`);
            return res.data;
        });



        const result = await runStep("FINAL_RESULT", async () => {
            const res = await client.get('https://gold.razer.com/api/webshopv2/' + checkoutRes.transactionNumber, {
                headers: {
                    "accept": "application/json, text/plain",
                    "x-razer-accesstoken": session.ssoToken,
                    "x-razer-language": "en",
                    "x-razer-razerid": session.uuid,
                    "origin": "https://gold.razer.com",
                    "referer": "https://gold.razer.com/global/en/gold/catalog/freefire-pins",
                }
            });
            if (res.status >= 400) throw new Error(`final result http ${res.status}`);
            return res.data;
        });

        const pin = result.fullfillment?.pins[0]?.pinCode1 ?? null;

        if (pin) {
            
            await Digicode.create({
                purchase_id: purchase.id,
                tnx_id: checkoutRes.transactionNumber,
                package_id: purchase.package_id,
                orderId: checkoutRes.amount,
                code: pin,
                status: 1,
            });

        }
        
        console.log(`✅ Order #${orderNumber} completed. PIN: ${pin || 'No PIN found'}`);
        console.log(`🔑 Session used ${cachedSession.useCount} times, age: ${Math.round(sessionAge / 1000)}s`);

        return pin;
    }

    async runMultipleOrders({ email, passPlain, secretTotp, product, count = 100, delayBetweenOrders = 5000 ,purchase,packages}: any) {
        console.log(`🚀 Starting ${count} orders...`);
        const results = [];
        const errors = [];

        // Reset cache
        cachedSession = {
            ssoToken: null,
            uuid: null,
            otpTokenEnc: null,
            createdAt: 0,
            useCount: 0
        };
        let loginData = await this.razarlogin({ email, passPlain});
        let uuid = loginData.uuid;
        let token = loginData.token;
        for (let i = 1; i <= count; i++) {

            if (i % 1000 === 0) {
                console.log(`🔐 Relogin triggered at order #${i}`);

                loginData = await this.razarlogin({ email, passPlain });
                uuid = loginData.uuid;
                token = loginData.token;

                console.log(`✅ Relogin successful`);
            }

            purchase.count=purchase.count+1;
            await purchase.save();
            console.log(`\n📊 Progress: ${i}/${count}`);
            console.log(`✅ Success: ${results.length}, ❌ Failed: ${errors.length}`);

            try {
                const startTime = Date.now();
                const pin = await this.orderRazer({
                    email,
                    secretTotp,
                    product,
                    orderNumber: i,
                    purchase,
                    packages,
                    uuid,
                    token
                });
                const elapsedTime = Date.now() - startTime;

                results.push({ orderNumber: i, pin, time: elapsedTime, success: true });
                console.log(`⏱️  Order #${i} took ${elapsedTime}ms`);

            } catch (error: any) {
                errors.push({ orderNumber: i, error: error.message, time: Date.now(), success: false });
                console.error(`❌ Order #${i} failed: ${error.message}`);

                // If error is likely session-related, reset session
                if (error.message.includes('401') || error.message.includes('403') ||
                    error.message.includes('token') || error.message.includes('OTP')) {
                    console.log('🔄 Resetting session due to auth error');
                    cachedSession = {
                        ssoToken: null,
                        uuid: null,
                        otpTokenEnc: null,
                        createdAt: 0,
                        useCount: 0
                    };
                }
            }

            if (i < count) {
                console.log(`⏳ Waiting ${delayBetweenOrders / 1000} seconds before next order...`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenOrders));
            }
        }

        purchase.status = 'completed';
        await purchase.save();
        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📋 ORDER SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total Orders Attempted: ${count}`);
        console.log(`✅ Successful Orders: ${results.length}`);
        console.log(`❌ Failed Orders: ${errors.length}`);
        console.log(`🎯 Success Rate: ${((results.length / count) * 100).toFixed(2)}%`);

        if (results.length > 0) {
            console.log('\n📄 Successful PINs:');
            results.forEach((r: any) => console.log(`  Order #${r.orderNumber}: ${r.pin || 'No PIN'}`));
        }

        if (errors.length > 0) {
            console.log('\n🚨 Failed Orders:');
            errors.forEach((e: any) => console.log(`  Order #${e.orderNumber}: ${e.error}`));
        }

        return { results, errors };
    }

    async getTransactionHistory({ params,response,request }: HttpContext){

        let purchase = await Purchase.find(params.id);
        let acc = await Banar.find(purchase?.account_id || 0);
        const email = acc?.email || '';
        const passPlain = acc?.password || '';
        const loginData = await this.razarlogin({ email, passPlain});
        const parsed = loginData;
        const date = request.input('date');
        const r = await client.get(
            'https://gold.razer.com/api/transactions/history',
            {
                headers: {
                    accept: "application/json, text/plain, */*",
                    "x-razer-accesstoken": parsed.token,
                    "x-razer-fpid": "16f47c6af38e40251246e9f19a73f501",
                    "x-razer-razerid": parsed.uuid,
                    referer: "https://gold.razer.com/global/en/account/summary",
                },
            }
        );

        let data = r.data
        let arr = [];
        for (const element of data.Transactions) {

            // if(!date || element.txnDate.startsWith(date)){
            // // console.log(element);
                
            // }
            if(element.statusDescription && (element.statusDescription == "Success" || element.statusDescription == "Payment Incomplete" || element.statusDescription == "Pending" ) && (!date || element.txnDate.startsWith(date))){
                console.log(`Fetching transaction details for TNX ID: ${element?.txnNum}`);
                const res = await client.get(
                    'https://gold.razer.com/api/webshopv2/' + element?.txnNum,
                    {
                        headers: {
                        accept: "application/json, text/plain, */*",
                        "x-razer-accesstoken": parsed.token,
                        "x-razer-fpid": "16f47c6af38e40251246e9f19a73f501",
                        "x-razer-razerid": parsed.uuid,
                        referer: "https://gold.razer.com/global/en/account/summary",
                        },
                    }
                );
                
                let pin = null;

                if(res.data.fullfillment?.pins!=null){
                    pin = res.data.fullfillment?.pins[0]?.pinCode1 ?? null;
                }

                let digicode = await Digicode.query().where('tnx_id',element?.txnNum);
                if(digicode.length==0){
                    // insert digicode
                    await Digicode.create({
                        code:pin,
                        tnx_id:element?.txnNum,
                        status:1,
                        purchase_id:params.id,
                        package_id:purchase?.package_id
                    })
                }

                arr.push({
                    "amount": element.amount,
                    "description": element.description,
                    "txnDate": element.txnDate,
                    "txnNum": element.txnNum,
                    "pin": pin
                });
            }
        }
        console.log('data fetched successfully');
        console.log(arr)
        return response.send(arr);
    }

}


    // 
        // {
        //     "amount": 1.04,
        //     "currencyCode": "USD",
        //     "description": "FreeFire USD 1 (100 Diamonds)",
        //     "isRazerGold": true,
        //     "isReceiptAvailable": true,
        //     "paymentMethod": "Razer Gold",
        //     "regionId": 2,
        //     "status": 1,
        //     "statusDescription": "Success",
        //     "txnDate": "2026-01-05T00:54:35.060183+00:00",
        //     "txnNum": "122K76L8IUSVEDF8DC17B",
        //     "txnTabType": "webshop",
        //     "txnTypeID": 2
        // }