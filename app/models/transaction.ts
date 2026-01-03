import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo  } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare amount: number

  @column()
  declare status: String

  @column()
  declare comment: string

  @column()
  declare purpose: string

  @column()
  declare payment_method: String

  @column()
  declare sender_number: String

  @column()
  declare paymenturl: String

  @column()
  declare transaction_id: String

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User,{foreignKey: 'user_id'})
  declare user: BelongsTo<typeof User>
}