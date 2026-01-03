import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Setting extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare data:any

  @column()
  declare logo:string

  @column()
  declare ficon:string

  @column()
  declare model_banner:string

  @column()
  declare wallet_logo:string

  @column()
  declare icon192:string

  @column()
  declare icon512:string

  @column()
  declare auto_pay_logo:string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}