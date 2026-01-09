import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router.get('/admin/login', '#controllers/admin_controller.show').use(middleware.guest())
router.post('/admin/login', '#controllers/admin_controller.login').use(middleware.guest())
router.group(() => {
    router.get('/', '#controllers/admin_controller.index').as('home')
    router.get('/color', '#controllers/admin_controller.color').as('color')
    router.post('/colorupdate', '#controllers/admin_controller.colorupdate').as('colorupdate')
    router.get('/checkadminupdate', '#controllers/admin_controller.checkadminupdate').as('checkadminupdate')
    router.get('/checkuserpdate', '#controllers/admin_controller.checkuserpdate').as('checkuserpdate')
    router.get('/users', '#controllers/admin_controller.users').as('users.index')
    router.get('/users/show/:id', '#controllers/admin_controller.delete').as('users.show')
    router.get('/users/:id/edit', '#controllers/admin_controller.edit').as('users.edit')
    router.post('/users/:id', '#controllers/admin_controller.userupdate').as('users.update')
    router.get('/profile', '#controllers/admin_controller.profile').as('profile')
    router.post('/update', '#controllers/admin_controller.update').as('user.update')
    router.get('/update/actualstock/:id', '#controllers/admin_controller.actualstock').as('update.actualstock')
    router.post('/password/update', '#controllers/admin_controller.passwordupdate').as('password.change')
    router.get('/purchase/use/:id', '#controllers/purchases_controller.use').as('purchase.use')
    router.get('/delete/voucher/:id', '#controllers/purchases_controller.deletevoucher').as('delete.voucher')
    router.get('/setting', '#controllers/settings_controller.index').as('setting')
    router.post('/setting/update', '#controllers/settings_controller.update').as('setting.update')
    router.post('/logo/update', '#controllers/settings_controller.logoupdate').as('logo.update')
    router.get('/orders', '#controllers/orders_controller.index').as('orders')
    router.get('/order/update/:id', '#controllers/orders_controller.update').as('order.update')
    router.get('/order/delete/:id', '#controllers/orders_controller.delete').as('order.delete')
    router.get('/order/resend/:id', '#controllers/orders_controller.resend').as('order.resend')
    router.get('/transaction', '#controllers/transactions_controller.index').as('transaction')
    router.get('/transaction/complete/:id', '#controllers/transactions_controller.complete').as('transaction.complete')
    router.get('/transaction/cancel/:id', '#controllers/transactions_controller.cancel').as('transaction.cancel')
    router.get('/purchase/:id/start-order', '#controllers/purchases_controller.startOrder').as('purchase.startOrder')
    router.get('/purchase/:id/fatch-order/:date?', '#controllers/purchases_controller.getTransactionHistory').as('purchase.fatch')
    router.get('/banar/:id/updatebalance', '#controllers/banars_controller.updatebalance').as('banar.updatebalance')
    router.resource('/product', '#controllers/products_controller');
    router.post('/product/addfield/:id', '#controllers/products_controller.addfield').as('product.addfield')
    router.post('/product/deletefield/:id/:field_id', '#controllers/products_controller.deletefield').as('product.deletefield')
    router.resource('/package', '#controllers/packages_controller');
    router.resource('/purchase', '#controllers/purchases_controller').except(['create','destroy','update']);
    router.post('/purchase/storeunipin', '#controllers/purchases_controller.storeunipin').as('storeunipin')
    router.resource('/banar', '#controllers/banars_controller');
    

})
.prefix('/admin')
.as('admin')
.use([
    middleware.auth(),
    middleware.admin(),
])

router.get("/",function({response}){
    return response.redirect('/admin/banar')
})

router.post('/complete', '#controllers/autotopups_controller.complete')

router
  .get('logout', async ({ auth, response }) => {
    await auth.use('web').logout()
    return response.redirect('/admin/login')
  })
  .use(middleware.auth()).as('logout')
