import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'banars'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('link').nullable()
      table.string('logo').nullable()
      table.integer('fixed').defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}