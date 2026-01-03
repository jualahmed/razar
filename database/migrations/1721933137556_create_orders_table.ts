import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('user_id')
      table.integer('package_id')
      table.integer('product_id')
      table.string('package_name')
      table.float('buy_price')
      table.float('sale_price')
      table.string('info').nullable()
      table.integer('comment_id').nullable()
      table.integer('qty').nullable()
      table.integer('count').nullable()
      table.string('editor_id').nullable()
      table.string('server').nullable()
      table.string('content').nullable()
      table.string('status').nullable()
      table.string('payment').nullable()
      table.string('transaction_id').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}