const fs = require("fs")
const request = require("request").defaults({
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

// 从原始数据提取所有属性id
let nodes = JSON.parse(fs.readFileSync('./rawData.json','utf-8')).nodes
let propIds = []
nodes.forEach(node => {
  if (node.hasOwnProperty('claims')){
    for (let i = 0; i < Object.keys(node.claims).length; i++){
      let propId = Object.keys(node.claims)[i]
      if(!propIds.includes(propId)){
        propIds.push(propId)
      }
    }
  }
});


const getf = async function(){
  for(let i = 0; i < propIds.length; i++){
    let cid = propIds[i]
    let propsInfoFile = JSON.parse(fs.readFileSync('./props.json', 'utf-8')).props
    let inFile = false
    for (let j = 0; j < propsInfoFile.length; j++){
      if (propsInfoFile[j].id == cid){
        inFile = true
        break
      }
    }
    if (!inFile){
      console.log('Getting: ' + cid + '\'s info from wikidata');
      let body = await syncBody('https://www.wikidata.org/wiki/Special:EntityData/' + cid + '.json')
      console.log(i+1 + '/' + propIds.length);
      propsInfoFile.push({
        id: cid,
        value: body.entities[cid].labels.en.value
      })
      fs.writeFileSync('props.json', JSON.stringify({props:propsInfoFile}),'utf-8',(error)=>{
        if(error) throw error;
      })
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