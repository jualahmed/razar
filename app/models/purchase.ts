import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo  } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Package from '#models/package'
export default class Purchase extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare package_id:number

  @column()
  declare qty:number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
  
  @belongsTo(() => Package,{foreignKey: 'package_id'})
  declare package: BelongsTo<typeof Package>
}