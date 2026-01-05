import type { HttpContext } from '@adonisjs/core/http'
import Banar from '#models/banar'
import axios from 'axios';
// import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import CryptoJS from "crypto-js";
import { HttpsProxyAgent } from 'https-proxy-agent';
import env from '#start/env'

const proxyAgent = new HttpsProxyAgent(env.get('PROXY') || ''); 

const jar = new CookieJar();

const cookieJar = new CookieJar();

// const client = wrapper(
//     axios.create({
//         jar,
//         withCredentials: true,
//         timeout: 30000,
//         validateStatus: () => true,
//     })
// );

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


function pick(xml: string, tag: string) {
    const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
    return m ? m[1].trim() : null;
}

function short(obj: any, max = 400) {
    try {
        const s = typeof obj === "string" ? obj : JSON.stringify(obj);
        return s.length > max ? s.slice(0, max) + "…(cut)" : s;
    } catch {
        return String(obj);
    }
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

async function runStep(stepName: string, fn: Function) {
    try {
        const out = await fn();
        return out;
    } catch (err) {
        const e = makeStepError(stepName, err);
        throw e;
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

	async updatebalance({ params ,response}: HttpContext) {
		const banar = await Banar.find(params.id);
		if(banar){
			try {
				const accountSummary = await this.accsummary({ email: banar.email, passPlain: banar.password });
				if(accountSummary){
					banar.balance=accountSummary.totalGold;
					await banar.save();
				}
			} catch (error) {
				console.error('Error updating balance:', error);
			}
		}
		return response.redirect().back();
	}

	async accsummary({ email, passPlain}: any) {
        console.log(email)
        console.log(passPlain)
         const serviceCode = "0770";
        const clientId = "63c74d17e027dc11f642146bfeeaee09c3ce23d8";
        const difTime = 0;

        // Clear cookies
        try { jar.removeAllCookiesSync(); } catch (e) { }

        const { xml } = buildCopXmlRev1({ email, passPlain, serviceCode, difTime });

        const loginRes = await runStep("COP_LOGIN", async () => {
            
	        const requestOptions:any = { ...defaultOptions };

            const cookies = await cookieJar.getCookieString('https://razerid.razer.com/api/emily/7/login/get');
            if (cookies) {
                requestOptions.headers= {
                    ...requestOptions.headers,
                    'Cookie': cookies
                };
            }

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
        let accountSummary = await this.getAccountSummary(parsed.token!, parsed.uuid!);
        return accountSummary;
    }

    // Razer API Methods
    async getAccountSummary(accessToken: string, uuid: string) {
        try {
            const res = await axios.get("https://gold.razer.com/api/gold/accountsummary", {
                headers: {
                    "accept": "application/json, text/plain, */*",
                    "x-razer-accesstoken": accessToken,
                    "x-razer-fpid": '16f47c6af38e40251246e9f19a73f501',
                    "x-razer-razerid": uuid,
                    "referer": "https://gold.razer.com/global/en/account/summary",
                },
            });
            return res.data;
        } catch (err: any) {
            console.error("❌ Failed to fetch account summary:", err.message);
            return null;
        }
    }
}