import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo,hasMany  } from '@adonisjs/lucid/orm'
import Comment from '#models/comment'
import User from '#models/user'
import Digicode from '#models/digicode'
import type { BelongsTo,HasMany } from '@adonisjs/lucid/types/relations'
export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: Number

  @column()
  declare package_id: Number

  @column()
  declare product_id: Number

  @column()
  declare package_name: String

  @column()
  declare buy_price: number

  @column()
  declare sale_price: number

  @column()
  declare editor_id: string

  @column()
  declare qty: number
  
  @column()
  declare count: number

  @column()
  declare info: string

  @column()
  declare content: string

  @column()
  declare comment_id: number

  @column()
  declare server: string

  @column()
  declare status: String

  @column()
  declare payment: String

  @column()
  declare transaction_id: String

  @column.dateTime({
    autoCreate: true,
    serialize: (value) => value.toFormat('yyyy-LL-dd h:m:s')
  })
  declare createdAt: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    serialize: (value) => value.toFormat('yyyy-LL-dd h:m:s')
  })
  declare updatedAt: DateTime

  @belongsTo(() => Comment,{foreignKey: 'comment_id'})
  declare comment: BelongsTo<typeof Comment>

  @belongsTo(() => User,{foreignKey: 'user_id'})
  declare user: BelongsTo<typeof User>

  @hasMany(() => Digicode, {
    localKey: 'id', 
  })
  
  declare digicodes: HasMany<typeof Digicode>
}