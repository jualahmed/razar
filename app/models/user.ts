import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare sl: number

  @column()
  declare api: string | null

  @column()
  declare email: string
  
  @column()
  declare name: string

  @column()
  declare phone: string

  @column()
  declare avatar: string

  @column()
  declare is_admin: number

  @column()
  declare wallet: number

  @column()
  declare earn_wallet: number

  @column()
  declare coin: number

  @column()
  declare role: string // 'admin' | 'moderator' | 'user'

  @column()
  declare refer_id: number

  @column({ serializeAs: null })
  declare password: string
  
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
}