import { BaseSchema } from '@adonisjs/lucid/schema'
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

  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}