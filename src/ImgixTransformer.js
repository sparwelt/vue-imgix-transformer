import ImgixClient from './SwImgixClient'

const absolutePathReg = /^http/
const imgElementSearchReg = /(<img[^>]+>)/gi

export default class ImgixTransformer {
  constructor(imgixCdnConfigs) {
    this.imgixCdnConfigs = imgixCdnConfigs
    this.clients = this.getClients(imgixCdnConfigs)
  }

  getClients(configs) {
    let clients = {}

    for (let configName in configs) {
      let { cdnOptions } = configs[configName]
      clients[configName] = new ImgixClient(cdnOptions)
    }

    return clients
  }

  getClient(configName) {
    if ('undefined' !== typeof configName) {
      return this.clients[configName]
    }

    for (let name in this.imgixCdnConfigs) {
      return this.clients[name]
    }
  }

  getConfigName(url) {
    let cdnConfigs = this.imgixCdnConfigs

    return Object.keys(cdnConfigs).filter(key => {
      return url.indexOf(cdnConfigs[key].sourceDomain) > -1
    })[0]
  }

  transformUrl(originalUrl, options) {
    let configName = this.getConfigName(originalUrl)
    let imagePath = originalUrl

    if (absolutePathReg.test(originalUrl)) {
      if ('undefined' === typeof configName) {
        return originalUrl
      }

      let { sourceDomain } = this.imgixCdnConfigs[configName]
      imagePath = originalUrl.split(sourceDomain).pop()
    }

    return decodeURIComponent(this.getClient(configName).buildURL(imagePath, options))
  }

  /* deprecated */
  generateImageElement(originalUrl, options) {
    let imgElement = document.createElement('img')
    let url = this.transformUrl(originalUrl, options)
    imgElement.setAttribute('src', url)

    return imgElement
  }

  transformHtml(originalHtml, options) {
    if ('undefined' === typeof document) {
      return
    }

    const replacer = match => {
      const wrapperEl = document.createElement('div')
      wrapperEl.innerHTML = match
      const imagePath = wrapperEl.firstChild.getAttribute('src')
      wrapperEl.firstChild.src = this.transformUrl(imagePath, options)

      return wrapperEl.innerHTML
    }

    return originalHtml.replace(imgElementSearchReg, replacer)
  }
}
