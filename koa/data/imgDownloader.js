const fs = require('fs')
const request = require('request').defaults({
  proxy: "http://127.0.0.1:7890",
  rejectUnauthorized: false,
})

const downloadPic = function(src, dest){
  return new Promise((resolve, reject) => {
    try{
      let stream = fs.createWriteStream(dest)
      request(src).pipe(stream).on('close',function(){
        stream.close()
        console.log('Picture saved!')
        resolve(true)
      })
    } catch{
      console.log(error);
      reject(error)
    }
  })
  
}


let imgUrls = JSON.parse(fs.readFileSync('./imageUrls.json', 'utf-8')).imgUrls

for(let i = 0; i < imgUrls.length; i++){
  let imgPath = encodeURI(imgUrls[i].imgUrl);
  console.log(imgPath);
  let imgType = '.jpg'
  if (imgPath.includes('.png')){
    imgType = '.png'
  }

  downloadPic(imgPath,'./img/' + imgUrls[i].id + imgType).then(()=>{
    console.log("Download success");
  }, (err) => {
    console.log(err);
  }).then(undefined, err => {
      console.log(err);
  })
}

