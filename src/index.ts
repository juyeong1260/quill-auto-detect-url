import normalizeUrl from 'normalize-url'
import Delta from 'quill-delta'
import type { Quill } from 'quill'
import type Op from 'quill-delta/dist/Op'

const defaults = {
  urlRegularExpression: /(https?:\/\/|www\.)[\w-.]+\.[\w-.]+[\S]+/i,
  normalizeRegularExpression: /(https?:\/\/|www\.)[\S]+/i,
}

export type QuillAutoDetectUrlOptions = { [key: string]: any } & {
  urlRegularExpression: RegExp
  normalizeRegularExpression: RegExp
}

export default class QuillAutoDetectUrl {
  private quill: Quill
  private options: QuillAutoDetectUrlOptions
  constructor(quill: Quill, options: QuillAutoDetectUrlOptions) {
    this.quill = quill
    options = options || {}

    this.options = { ...defaults, ...options }
    this.registerTypeListener()
  }
  private registerTypeListener() {
    this.quill.on('text-change', (delta) => {
      const ops = delta.ops
      if (!ops || ops.length < 1 || ops.length > 2) {
        return
      }
      const lastOp = ops[ops.length - 1]
      if (!lastOp.delete && (!lastOp.insert || typeof lastOp.insert !== 'string')) {
        return
      }

      this.checkTextForUrl(lastOp.insert)
    })
  }
  private checkTextForUrl(insert: Op['insert']) {
    const sel = this.quill.getSelection()
    if (!sel) {
      return
    }
    const [leaf] = this.quill.getLeaf(sel.index)
    if (insert === '\n') {
      const [nextLeaf] = this.quill.getLeaf(sel.index + sel.length + 1)
      if (nextLeaf && nextLeaf.parent.domNode.localName === 'a') {
        this.transformLeaf(nextLeaf)
      }
      this.transformLeaf(leaf)
    } else {
      const [prevLeaf] = this.quill.getLeaf(sel.index - 1)
      if (prevLeaf.parent.domNode.localName === 'a' && prevLeaf.parent.domNode !== leaf.parent.domNode) {
        const url = prevLeaf.text + (leaf.text || '')
        const urlMatch = url.match(this.options.urlRegularExpression)

        if (urlMatch) {
          const prevQuillIndex = this.quill.getIndex(prevLeaf) + urlMatch.index

          // for mboile device (keyboard selection bug)
          this.quill.removeFormat(prevQuillIndex, prevLeaf.text.length)
          this.textToUrl(prevQuillIndex, urlMatch[0])
        }
      } else {
        this.transformLeaf(leaf)
      }
    }
  }
  private transformLeaf(leaf: any) {
    const urlMatch = leaf.text?.match(this.options.urlRegularExpression)
    const leafIndex = this.quill.getIndex(leaf)
    if (urlMatch) {
      this.textToUrl(leafIndex + urlMatch.index, urlMatch[0])

      // for android mobile device keyboard
      // it resolved weird phenomenon when some text infront of www.xxx.xxx link
      this.quill.enable(false)
      this.quill.enable(true)
    } else if (leaf.parent.domNode.localName === 'a') {
      this.quill.removeFormat(leafIndex, leaf.text?.length || 0)
    }
  }
  private textToUrl(index: number, url: string) {
    const ops = new Delta().retain(index).retain(url.length, { link: this.urlNormalizer(url) })

    this.quill.updateContents(ops as any)
  }

  private urlNormalizer(url: string) {
    if (this.options.normalizeRegularExpression.test(url)) {
      try {
        return normalizeUrl(url, this.options.normalizeUrlOptions)
      } catch (error) {
        console.error(error)
      }
    }
    return url
  }
}
