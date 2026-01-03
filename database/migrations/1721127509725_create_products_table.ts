import { BaseSchema } from '@adonisjs/lucid/schema'
import Product from '#models/product'
export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      	table.increments('id')
      	table.string('name')
      	table.string('slug')
      	table.text('description')
      	table.text('link')
      	table.text('logo')
      	table.float('sale_price')
      	table.float('buy_price')
      	table.integer('quantity')
      	table.integer('category_id')
      	table.integer('uid_check')
      	table.integer('lavel')
      	table.integer('saletype')
      	table.integer('type')
      	table.integer('is_active')
      	table.text('info').defaultTo('[]')
      	table.timestamp('created_at').notNullable()
      	table.timestamp('updated_at').nullable()
	
		Product.create({
			id: 1,
			name: 'FREE FIRE (UID)',
			slug: 'FREE-FIRE',
			description: 'test',
			link: 'test',
			logo: 'test',
			sale_price: 100,
			buy_price: 100,
			quantity: 100,
			category_id: 1,
			uid_check: 1,
			lavel: -1,
			saletype: 1,
			type: 1,
			is_active: 1,
			info: '[{"id":1,"name":"player_id","value":"এখানে আইডি কোড দিন ।"}]',
		})

		Product.create({
			id: 2,
			name: 'Unipin Voucher [BD]',
			slug: 'FREE-FIRE',
			description: 'test',
			link: 'test',
			logo: 'test',
			sale_price: 100,
			buy_price: 100,
			quantity: 100,
			category_id: 1,
			uid_check: 1,
			lavel: 1,
			saletype: 1,
			type: 1,
			is_active: 1,
			info: '[{"id":1,"name":"quantity","value":"quantity"}]',
		})

		Product.create({
			id: 30,
			name: 'Hidden Product',
			slug: 'FREE-FIRE',
			description: 'test',
			link: 'test',
			logo: 'test',
			sale_price: 100,
			buy_price: 100,
			quantity: 100,
			category_id: 1,
			uid_check: 1,
			lavel: -1,
			saletype: 1,
			type: 1,
			is_active: 0,
			info: '[{"id":1,"name":"player_id","value":"এখানে আইডি কোড দিন ।"}]',
		})
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}