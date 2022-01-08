const { Menu, Plugin, TFile, addIcon } = require('obsidian')
const fs = require('hexo-fs');
const path = require('path')
const Eventproxy = require('eventproxy');
const copyFileSync = require('fs-copy-file-sync');
const imageType = require('image-type');
const log = require('hexo-log')({
  debug: false,
  silent: false
});

// 处理 post 中图片
hexo.extend.processor.register('posts/:id.md', function(file) {
  const config = this.config.easy_images
  const ep = new Eventproxy()

  if (file.type == 'delete') return file
  if (file.type == 'skip' && config && !config.init) return file

  log.info(`EasyImages: process ${file.params.id}`)
  //获取图片列表
  var content =  fs.readFileSync(file.source)
  var pattern = /!\[.*?\]\((.*?)\)/g
  var absolute_images = []
  var relative_images = []
  var online_images = []
  var diff_list = []

  while((match=pattern.exec(content)) != null) {
    let url = match[1]

    if (url[0] == '/' || url[0] == '~') {
      absolute_images.push(url)
    } else if (/^http/.test(url)) {
      online_images.push(url)
    } else if (url) {
      relative_images.push(url)
    }
  }

  if (absolute_images.length + relative_images.length + online_images.length  == 0) return file

  var dir_root = this.base_dir
  var dir_post = path.dirname(file.source)
  var dir_source = this.source_dir
  var dir_images = path.join(dir_source, 'images', file.params.id)

  if (!fs.existsSync(dir_images)) fs.mkdirsSync(dir_images)

  // 将相对路径图片加入待处理队列 diff_list
  relative_images.forEach(img => {
    let info = {
      origin: img
    }

    info.from = path.resolve(dir_post, img)

    if (!fs.existsSync(info.from)) {
      log.warn(`${file.id}: Can't find ${img}`)
      return
    }

    if (path.dirname(info.from) == dir_images) {
      info.skip_copy = true
    }

    info.to = path.join(dir_images, path.basename(info.from))
    info.new = path.relative(dir_post, info.to)
    diff_list.push(info)
  })

  // 处理图片与 Post
  ep.after('download', online_images.length, (list) => {
    var mapObj = {}

    diff_list.forEach(info => {
      //Copy 本地图片
      if (!info.skip_copy) {
        copyFileSync(info.from, info.to)
      }

      //替换图片新地址
      if (info.new && info.origin != info.new) {
        info.origin = info.origin.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")
        mapObj[info.origin] = info.new
      }
    })


    if (Object.keys(mapObj).length) content = replaceAll(content, mapObj)

    fs.writeFile(file.source, content)
    return file
  })

  ep.fail((err) => {
    log.error(err)
  })

  function replaceAll(str, mapObj){
    var re = new RegExp(Object.keys(mapObj).join("|"),"gi");

    return str.replace(re, function(matched){
      return mapObj[matched.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")]
    });
  }

})

//将相对地址转为绝对地址
hexo.extend.filter.register('before_post_render', function(data){
  const config = this.config.easy_images
  var dir_post = path.join(this.source_dir, data.source)
  var post_id = path.basename(data.source, '.md')
  var dir_images = path.join(this.source_dir, 'images', post_id)
  var pattern = /!\[(.*?)\]\((.*?)\)/g

  data.content = data.content.replace(pattern, (match, alt, src) => {
    if (path.dirname(src) != path.relative(path.dirname(dir_post), dir_images)) {
      return match
    }

    let path_img = path.resolve(dir_post, '..', src)
    let src_new = path_img.replace(this.source_dir, '/')

    if (config && config.cdn_prefix && src_new[0] == '/') {
       src_new = config.cdn_prefix + src_new
    }

    return `![${alt}](${src_new})`
  })

  return data;
});
