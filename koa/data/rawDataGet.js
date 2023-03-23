const fs = require('fs')
const ids = JSON.parse(fs.readFileSync('./ids.json', 'utf-8')).ids
const request = require('request').defaults({
  proxy: "http://127.0.0.1:7890",
  rejectUnauthorized: false,
})

function syncRequest(url, params){
  let options = {
    url: url,
    form: params
  }

  return new Promise((resolve, reject) => {
    request.get(options,(error, response, body)=>{
      if (!error && response.statusCode == 200){
        resolve(body)
      } else{
        reject(error)
      }
    })
  })
}

const syncBody = async function(url){
  let body = await syncRequest(url)
  return JSON.parse(body)
}

const getf = async function(){
  for (let i = 0; i < ids.length; i++){
    let cid = ids[i]
    let nodeInfo = JSON.parse(fs.readFileSync('./rawData.json', 'utf-8')).nodes
    let inFile = false
    for (let j = 0; j < nodeInfo.length; j++){
      if (nodeInfo[j].id == cid){
        inFile = true
        break
      }
    }
    if (!inFile){
      console.log('Getting: ' + cid + '\'s info from wikidata');
      let body = await syncBody('https://www.wikidata.org/wiki/Special:EntityData/' + cid + '.json')
      console.log(i+1 + '/' + ids.length);
      nodeInfo.push(body.entities[cid])
      fs.writeFileSync('rawData.json', JSON.stringify({nodes:nodeInfo}),'utf-8',(error)=>{
        if(error) throw error;
      })
    }else{
      console.log(cid, "allready in file.");
    }
    
  }
}

getf()


