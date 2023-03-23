const fs = require('fs')
const request = require('request').defaults({
  proxy: "http://127.0.0.1:7890",
  rejectUnauthorized: false,
  timeout: 5000,
})

let imgs = []

let nodes = JSON.parse(fs.readFileSync('./data.json', 'utf-8')).nodes

nodes.forEach(node => {
  if (node.imgUrl !== "Image Not Found"){
    imgs.push({
      id: node.id,
      imgUrl: node.imgUrl
    })
  }
});

fs.writeFileSync('imageUrls.json', JSON.stringify({imgUrls: imgs}), 'utf-8')