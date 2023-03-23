import req from './request.js'

export const getEntityInfo = function (searchName) {
  return req('get', '/koa/getEntityInfo', {
    search: searchName
  })
}

export const getEntityImgUrl = function(entityName) {
  return req('get', '/baidu/api/openapi/BaikeLemmaCardApi?scope=103&format=json&appid=379020&bk_key='+entityName+'&bk_length=600')
}
