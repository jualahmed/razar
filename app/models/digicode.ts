import { DateTime } from 'luxon'
import { BaseModel, column ,belongsTo} from '@adonisjs/lucid/orm'
import Order from '#models/order'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
export default class Digicode extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code:String

  @column()
  declare status:number

  @column()
  declare purchase_id:number

  @column()
  declare product_id:number

  @column()
  declare tnx_id:string

  @column()
  declare package_id:number
  
  @column()
  declare orderId:number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Order,{foreignKey: 'orderId'})
  declare product: BelongsTo<typeof Order>
}