const Router = require('koa-router')
const request = require('request')
const fs = require('fs')
const path = require('path')

const router = new (Router)

router.get('/', (ctx) => {
  ctx.body = "homepage"
})

// router.get('/getEntityImage', async (ctx) => {
//   // let searchName = ctx.query.search
//   // try{
//   //   ctx.body = await request.get({
//   //     timeout:3000,
//   //     method: 'GET',
//   //     url: 'https://www.wikidata.org/w/api.php',
//   //     qs: {
//   //       action: 'wbsearchentities',
//   //       search: searchName,
//   //       language: 'en',
//   //       limit: '20',
//   //       format: 'json',
//   //     }
//   //   }, function (error, response, body){
//   //     if (!error && response.statusCode == 200) {
//   //       console.log(ctx.body);
//   //       return body
//   //     }else{
//   //       console.log()
//   //       console.log("error");
//   //     }
//   //   })
//   // } catch(e){
//   //   console.log(e)
//   // }
//   // let res = {
//   //   name: entityName,
//   //   imgUrl: "https://img1.baidu.com/it/u=2347401912,2087846925&fm=253&fmt=auto&app=138&f=JPEG?w=215&h=300",
//   //   link: "https://baike.baidu.com/item/%E9%98%BF%E5%B0%94%E4%BC%AF%E7%89%B9%C2%B7%E7%88%B1%E5%9B%A0%E6%96%AF%E5%9D%A6/127535?fr=kg_general",
//   //   properties: [
//   //     {
//   //       name: 'Albert Einstein'
//   //     },
//   //     {
//   //       homeland: 'America'
//   //     },
//   //     {
//   //       birthday: '1879-03-14'
//   //     },
//   //     {
//   //       college: ['ETH Zurich', 'University of Zurich']
//   //     }
//   //   ]

//   // }
  
//   // ctx.body = res
// })

router.get('/getEntityInfo', async (ctx) => {
  let entityName = ctx.query.search
  let res = {
    id: "Id Not Found",
    name: entityName,
    imgUrl: "Image Not Found",
    link: "Link Not Found",
    properties: []
  }
  let data = JSON.parse(fs.readFileSync('data/data.json','utf-8')).nodes
  for (let i = 0; i < data.length; i++){
    if (data[i].name == entityName){
      console.log("Found "+ entityName);
      res = data[i]
      break;
    }
  }
  ctx.body = res
})

module.exports = router