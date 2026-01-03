import Package from '#models/package'
import { DateTime } from 'luxon'
import { BaseModel, column,hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name:string

  @column()
  declare slug:string

  @column()
  declare description:string

  @column()
  declare link:string

  @column()
  declare logo:string

  @column()
  declare sale_price:number

  @column()
  declare category_id:number

  @column()
  declare buy_price:number

  @column()
  declare quantity:number

  @column()
  declare notify:number

  @column()
  declare lavel:number

  @column()
  declare uid_check:number
  
  @column()
  declare saletype:number

  @column()
  declare type:number

  @column()
  declare info:string

  @column()
  declare is_active:number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Package, {
    localKey: 'id', 
  })
  declare packages: HasMany<typeof Package>
}