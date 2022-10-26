import req from './request.js'

export const getEntityInfo = function (searchName) {
  return req('get', 'http://localhost:8082/getEntityInfo', {
    search: searchName
  })
}

export const getEntityImgUrl = function(entityName) {
  return req('get', '/baidu/api/openapi/BaikeLemmaCardApi?scope=103&format=json&appid=379020&bk_key='+entityName+'&bk_length=600')
}
