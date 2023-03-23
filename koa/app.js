const Koa = require('koa')
const app = new (Koa)

const koaRoute = require('./router/koa.route')
app.use(koaRoute.routes())

app.listen(3000, () => {
  console.log("server started at http://localhost:3000");
})


