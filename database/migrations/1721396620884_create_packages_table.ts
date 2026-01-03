import { BaseSchema } from '@adonisjs/lucid/schema'
import Package from '#models/package'
export default class extends BaseSchema {
  protected tableName = 'packages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name')
      table.string('relative_unipin_ids')
      table.string('tag_line')
      table.string('server')
      table.integer('product_id')
      table.float('buy_price')
      table.float('sale_price')
      table.float('common_price')
      table.integer('coin').defaultTo(0)
      table.integer('extra_fee')
      table.integer('stock')
      table.integer('lavel')
      table.integer('is_auto').defaultTo(0)
      table.integer('is_hide').defaultTo(0)
      table.timestamp('created_at')
      table.timestamp('updated_at').nullable()
    })

	Package.create({
		id: 1,
		name: 'Weekly Code',
		relative_unipin_ids:'[]',
		tag_line: '161',
		server: 'no',
		product_id: 2,
		buy_price: 100,
		sale_price: 100,
		common_price: 100,
		coin: 0,
		extra_fee: 0,
		stock: 100,
		lavel: 1,
		is_auto: 1,
		is_hide: 0,
	})

	Package.create({
		id: 2,
		name: 'Monthly Code',
		relative_unipin_ids:'[]',
		tag_line: '800',
		server: 'no',
		product_id: 2,
		buy_price: 100,
		sale_price: 100,
		common_price: 100,
		coin: 0,
		extra_fee: 0,
		stock: 100,
		lavel: 1,
		is_auto: 1,
		is_hide: 0,
	})

	Package.create({
		id: 4,
		name: '25 Dimonds Code',
		relative_unipin_ids:'[]',
		tag_line: '25',
		server: 'no',
		product_id: 2,
		buy_price: 100,
		sale_price: 100,
		common_price: 100,
		coin: 0,
		extra_fee: 0,
		stock: 100,
		lavel: 1,
		is_auto: 1,
		is_hide: 0,
	})

	Package.create({
		id: 5,
		name: 'Weekly',
		relative_unipin_ids:'["1"]',
		tag_line: '50',
		server: 'no',
		product_id: 1,
		buy_price: 100,
		sale_price: 100,
		common_price: 100,
		coin: 0,
		extra_fee: 0,
		stock: 100,
		lavel: 1,
		is_auto: 1,
		is_hide: 0,
	})

	Package.create({
		id: 6,
		name: 'Monthly',
		relative_unipin_ids:'["2"]',
		tag_line: '50',
		server: 'no',
		product_id: 1,
		buy_price: 100,
		sale_price: 100,
		common_price: 100,
		coin: 0,
		extra_fee: 0,
		stock: 100,
		lavel: 1,
		is_auto: 1,
		is_hide: 0,
	})

	Package.create({
		id: 7,
		name: '25 Dimonds',
		relative_unipin_ids:'["4"]',
		tag_line: '50',
		server: 'no',
		product_id: 1,
		buy_price: 100,
		sale_price: 100,
		common_price: 100,
		coin: 0,
		extra_fee: 0,
		stock: 100,
		lavel: 1,
		is_auto: 1,
		is_hide: 0,
	})
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}