import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo  } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Package from '#models/package'
import Banar from '#models/banar'
export default class Purchase extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare package_id:number

  @column()
  declare qty:number
  
  @column()
  declare status:string

  @column()
  declare count:number

  @column()
  declare account_id:number

  @column()
  declare cmt:number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
  
  @belongsTo(() => Package,{foreignKey: 'package_id'})
  declare package: BelongsTo<typeof Package>

   @belongsTo(() => Banar,{foreignKey: 'account_id'})
  declare banar: BelongsTo<typeof Banar>
}