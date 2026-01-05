import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'digicodes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      	table.increments('id')
		table.string('code')
		table.integer('status')
		table.integer('purchase_id')
		table.integer('product_id')
		table.text('tnx_id').nullable()
		table.integer('package_id')
		table.float('order_id')
		table.timestamp('created_at').notNullable()
		table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}