const fs = require('fs')
const request = require('request').defaults({
  proxy: "http://127.0.0.1:7890",
  rejectUnauthorized: false,
  timeout: 5000,
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

let ids = []
let nodes = JSON.parse(fs.readFileSync('./rawData.json', 'utf-8')).nodes
nodes.forEach(node=>{
  if (!ids.includes(node.id)){
    ids.push(node.id)
  }
  for(let i = 0; i< Object.keys(node.claims).length; i++){
    Object.values(node.claims)[i].forEach(value=>{
      if (value.mainsnak.hasOwnProperty('datavalue')){
        if(value.mainsnak.datavalue.hasOwnProperty('value')){
          if(value.mainsnak.datavalue.value.hasOwnProperty('id')){
            let newId = value.mainsnak.datavalue.value.id
            if (!ids.includes(newId)){
              ids.push(newId)
              console.log('New id');
            }
          }
        }
      }   
    })
  }
})

const getf = async function(){
  for(let i = 0; i < ids.length; i++){
    let cid = ids[i]
    let nodesInfoFile = JSON.parse(fs.readFileSync('./nodes.json', 'utf-8')).nodes
    let inFile = false
    for (let j = 0; j < nodesInfoFile.length; j++){
      if (nodesInfoFile[j].id == cid){
        inFile = true
        break
      }
    }
    if (!inFile){
      console.log('Getting: ' + cid + '\'s info from wikidata');
      let body = await syncBody('https://www.wikidata.org/wiki/Special:EntityData/' + cid + '.json')
      console.log(i+1 + '/' + ids.length);
      if (body.entities[cid].labels.hasOwnProperty('en')){
        nodesInfoFile.push({
          id: cid,
          value: body.entities[cid].labels.en.value
        })
        fs.writeFileSync('nodes.json', JSON.stringify({nodes:nodesInfoFile}),'utf-8',(error)=>{
          if(error) throw error;
        })
      }
    }else{
      console.log(cid, "allready in file.");
    }
  }
}


const getdataF = async function(){
  while(true){
    try {
      let a = await getf()
    } catch (error) {
      console.log(error);
    }
  }
}
getdataF()







