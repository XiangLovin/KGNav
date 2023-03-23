const fs = require("fs")
const md5 = require('md5')
const request = require("request").defaults({
  proxy: "http://127.0.0.1:7890",
  rejectUnauthorized: false,
})
let rawNodes = JSON.parse(fs.readFileSync('./rawData.json','utf-8')).nodes
let props = JSON.parse(fs.readFileSync('./props.json','utf-8')).props
let nodeInfo = JSON.parse(fs.readFileSync('./nodes.json','utf-8')).nodes


let nodes = {
  nodes:[]
}

rawNodes.forEach(rawNode => {
  let imgUrl = ""
  if (rawNode.claims.hasOwnProperty('P18')){
    let fileName = rawNode.claims.P18[0].mainsnak.datavalue.value.replace(/\s/g, '_')
    let md5sum = md5(fileName)
    // https://commons.wikimedia.org/w/thumb.php?f=Junior-Jaguar-Belize-Zoo.jpg
    imgUrl = "https://upload.wikimedia.org/wikipedia/commons/"+ md5sum[0] + '/' + md5sum[0] + md5sum[1]+'/'  +fileName
  } else {
    imgUrl = "Image Not Found"
  }
  let result = {
    id: rawNode.id,
    name: rawNode.labels.en.value,
    imgUrl: imgUrl,
    link: "https://www.wikidata.org/wiki/" + rawNode.id,
    properties: []
  }
  let claims = rawNode.claims
  for (let j = 0; j < Object.keys(claims).length; j++){
    let propName = getPropValue(Object.keys(claims)[j])
    let propValue = []
    Object.values(claims)[j].forEach(value => {
      if (value.mainsnak.hasOwnProperty('datavalue')){
        if(value.mainsnak.datavalue.hasOwnProperty('value')){
          if(value.mainsnak.datavalue.value.hasOwnProperty('id')){
            let v = getNodeValue(value.mainsnak.datavalue.value.id)
            if(v!== "")
            propValue.push(v)
          }
        }
      }
    });
    if (propValue.length > 0){
      if (propValue.length == 1){
        propValue = propValue[0]
      }
      result.properties.push({
        [propName]: propValue
      })
    }
  }
  nodes.nodes.push(result)
});

fs.writeFileSync('data.json', JSON.stringify(nodes),'utf-8',(error)=>{
  if(error) throw error;
})

function getPropValue(id){
  let value = ''
  props.forEach(prop => {
    if (prop.id == id){
      value = prop.value
    }
  });
  return value
}

function getNodeValue(id){
  let value = ''
  nodeInfo.forEach(node => {
    if (node.id == id){
      value = node.value
    }
  });
  return value
}