import Product from '#models/product'
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo  } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
export default class Package extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name:string

  @column()
  declare relative_unipin_ids:string

  @column()
  declare tag_line:any

  @column()
  declare server:string

  @column()
  declare product_id:number

  @column()
  declare buy_price:number

  @column()
  declare sale_price:number
  
  @column()
  declare is_hide:number

  @column()
  declare common_price:number

  @column()
  declare coin:number

  @column()
  declare extra_fee:number

  @column()
  declare shelltype:number

  @column()
  declare stock:number

  @column()
  declare lavel:number

  @column()
  declare is_auto:number

  @column()
  declare tgbotsp:number

  @column()
  declare tgbotcp:number
  
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Product,{foreignKey: 'product_id'})
  declare product: BelongsTo<typeof Product>
}