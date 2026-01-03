import { BaseSchema } from '@adonisjs/lucid/schema'
import User from '#models/user'
export default class extends BaseSchema {
  protected tableName = 'users'
  async up() {
    this.schema.createTable(this.tableName, (table) => {
      	table.string('id').notNullable()
      	table.increments('sl').nullable()
      	table.text('api').nullable()
      	table.string('name').nullable()
      	table.string('image').nullable()
      	table.string('email', 254).notNullable().unique()
      	table.string('phone', 254).nullable().unique()
      	table.string('password').nullable()
      	table.integer('is_admin').defaultTo(0)
      	table.float('wallet').defaultTo(0)
      	table.float('earn_wallet').defaultTo(0)
      	table.integer('coin').defaultTo(0)
      	table.integer('refer_id').nullable()
      	table.timestamp('created_at').notNullable()
      	table.timestamp('updated_at').nullable()
      	table.timestamp('email_verified').nullable()
		// table.string('role').defaultTo('user')

		User.create({
			id:1,
			sl: 1,
			name: 'admin',
			email: 'admin@gmail.com',
			password: '654321',
			is_admin: 1,
			phone: '1234567890',
		})
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}