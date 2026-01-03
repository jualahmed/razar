import { BaseSchema } from '@adonisjs/lucid/schema'
import Setting from '#models/setting'
export default class extends BaseSchema {
  protected tableName = 'settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      	table.increments('id')
	    table.text('data')	
	    table.text('logo')	
	    table.text('icon_192')	
	    table.text('icon_512')	
	    table.text('auto_pay_logo')	
	    table.text('wallet_logo')	
	    table.text('model_banner')	
	    table.text('ficon')	
      	table.timestamp('created_at').notNullable()
      	table.timestamp('updated_at').nullable()

		Setting.create({
			data: JSON.stringify({
			  _csrf: "AQFfL6nO-JlXVNlqczFWQVEOBr_GqMy2TQOs",
			  app_name: "Free Unipin ২০ সেকেন্ডে টপআপ কমপ্লিট করা হয় AI বট দিয়ে....!! আমাদের সাইট দিন রাত ২৪ ঘন্টা চালু থাকে",
			  small_notice: "Free Unipin ২০ সেকেন্ডে টপআপ কমপ্লিট করা হয় AI বট দিয়ে....!! আমাদের সাইট দিন রাত ২৪ ঘন্টা চালু থাকে",
			  app_link: "https://freeunipin.com/",
			  number: "01784622362",
			  email: "test@gmail.com",
			  fb: "#",
			  telegram: "@jualahmed",
			  youtube: "https://www.youtube.com/@GamingShifatYT",
			  addmoneytuto: "#",
			  title: "Free Unipin ২০ সেকেন্ডে টপআপ কমপ্লিট করা হয় AI বট দিয়ে....!! আমাদের সাইট দিন রাত ২৪ ঘন্টা চালু থাকে",
			  home_page_model: "0",
			  model_content: "Free Unipin ২০ সেকেন্ডে টপআপ কমপ্লিট করা হয় AI বট দিয়ে....!! আমাদের সাইট দিন রাত ২৪ ঘন্টা চালু থাকে",
			  button_text: "Mama Game Shop-মামা গেম শপ",
			  button_link: "https://mamagameshop.com/",
			  active_refer: "0",
			  min_redeem: "10000",
			  timehide: "1",
			  number_hide: "0",
			  coin_amount: "500",
			  dailyclame: "1000",
			  videocoin: "501",
			  currency: "USDT"
			}),
			logo: "https://freeunipin.com/uploads/logo.png",
			wallet_logo: "https://freeunipin.com/uploads/logo.png",
			model_banner: "https://freeunipin.com/uploads/logo.png",
			ficon: "https://freeunipin.com/uploads/logo.png",
		})	
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}