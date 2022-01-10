const { convertLinksAndSaveInSingleFile } = require('./converter');
const fs = require('hexo-fs');
const path = require('path');
const Eventproxy = require('eventproxy');
const log = require('hexo-log')({
  debug: false,
  silent: false
});

// 处理 post 中图片
hexo.extend.processor.register('posts/:id.md', function(file) {
    console.log(file)
//   const config = this.config.easy_images
//   const ep = new Eventproxy()

//   if (file.type == 'delete') return file
//   if (file.type == 'skip' && config && !config.init) return file

//   log.info(`EasyImages: process ${file.params.id}`)
//   //获取图片列表
//   var content =  fs.readFileSync(file.source)
//   var pattern = /!\[.*?\]\((.*?)\)/g
//   var absolute_images = []
//   var relative_images = []
//   var online_images = []
//   var diff_list = []

//   while((match=pattern.exec(content)) != null) {
//     let url = match[1]

//     if (url[0] == '/' || url[0] == '~') {
//       absolute_images.push(url)
//     } else if (/^http/.test(url)) {
//       online_images.push(url)
//     } else if (url) {
//       relative_images.push(url)
//     }
//   }

//   if (absolute_images.length + relative_images.length + online_images.length  == 0) return file

//   var dir_root = this.base_dir
//   var dir_post = path.dirname(file.source)
//   var dir_source = this.source_dir
//   var dir_images = path.join(dir_source, 'images', file.params.id)

//   if (!fs.existsSync(dir_images)) fs.mkdirsSync(dir_images)

//   // 将相对路径图片加入待处理队列 diff_list
//   relative_images.forEach(img => {
//     let info = {
//       origin: img
//     }

//     info.from = path.resolve(dir_post, img)

//     if (!fs.existsSync(info.from)) {
//       log.warn(`${file.id}: Can't find ${img}`)
//       return
//     }

//     if (path.dirname(info.from) == dir_images) {
//       info.skip_copy = true
//     }

//     info.to = path.join(dir_images, path.basename(info.from))
//     info.new = path.relative(dir_post, info.to)
//     diff_list.push(info)
//   })

//     if (Object.keys(mapObj).length) content = replaceAll(content, mapObj)

//     fs.writeFile(file.source, content)
//     return file
//   })

//   ep.fail((err) => {
//     log.error(err)
//   })

//   function replaceAll(str, mapObj){
//     var re = new RegExp(Object.keys(mapObj).join("|"),"gi");

//     return str.replace(re, function(matched){
//       return mapObj[matched.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")]
//     });
//   }

})