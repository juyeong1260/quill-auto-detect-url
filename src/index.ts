import normalizeUrl from 'normalize-url'
import type { LeafBlot } from 'parchment'
import Delta from 'quill-delta'
import type Quill from 'quill'
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
  private globalRegularExpression: RegExp

  constructor(quill: Quill, options: QuillAutoDetectUrlOptions) {
    this.quill = quill
    options = options || {}

    this.options = { ...defaults, ...options }
    this.globalRegularExpression = new RegExp(this.options.urlRegularExpression, 'gi')
    this.registerPasteListener()
    this.registerTypeListener()
  }
  private registerPasteListener() {
    this.quill.clipboard.addMatcher(Node.TEXT_NODE, (node: any, delta: any) => {
      if (typeof node.data !== 'string') {
        return
      }
      const urlRegExp = this.globalRegularExpression
      urlRegExp.lastIndex = 0
      const newDelta = new Delta()
      let index = 0
      let urlResult = urlRegExp.exec(node.data)
      const handleMatch = (result: any, regExp: any) => {
        const head = node.data.substring(index, result.index)
        newDelta.insert(head)
        const match = result[0]
        newDelta.insert(match, { link: this.urlNormalizer(match) })
        index = regExp.lastIndex
        return regExp.exec(node.data)
      }
      while (urlResult !== null) {
        urlResult = handleMatch(urlResult, urlRegExp)
      }
      if (index > 0) {
        const tail = node.data.substring(index)
        newDelta.insert(tail)
        delta.ops = newDelta.ops
      }
      return delta
    })
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

      requestAnimationFrame(() => {
        this.checkTextForUrl(lastOp.insert)
      })
    })
  }

  private checkTextForUrl(insert: Op['insert']) {
    const sel = this.quill.getSelection(true)
    if (!sel) {
      return
    }
    const [currentLeaf] = this.quill.getLeaf(sel.index)
    if (!currentLeaf) {
      return
    }

    if (insert === undefined) {
      const [nextLeaf] = this.quill.getLeaf(sel.index + 1)
      if (nextLeaf && nextLeaf !== currentLeaf && currentLeaf?.parent.domNode.localName === 'a') {
        const url = currentLeaf.domNode.textContent + (nextLeaf.domNode.textContent || '')
        const urlMatch = url.match(this.options.urlRegularExpression)
        if (urlMatch) {
          const quillIndex = this.quill.getIndex(currentLeaf) + urlMatch.index!
          this.quill.removeFormat(quillIndex, currentLeaf.domNode.textContent?.length ?? 0)
          this.textToUrl(quillIndex, urlMatch[0])
        }
      } else {
        this.transformLeaf(currentLeaf)
      }
    } else if (insert === '\n') {
      const [prevLeaf] = this.quill.getLeaf(sel.index - 1)
      if (prevLeaf && prevLeaf.parent.domNode.localName === 'a') {
        this.transformLeaf(prevLeaf)
      }
      this.transformLeaf(currentLeaf)
    } else {
      const [prevLeaf] = this.quill.getLeaf(sel.index - 1)

      if (prevLeaf?.parent.domNode.localName === 'a' && prevLeaf.parent.domNode !== currentLeaf?.parent.domNode) {
        const url = prevLeaf.domNode.textContent + (currentLeaf.domNode.textContent || '')
        const urlMatch = url.match(this.options.urlRegularExpression)
        if (urlMatch) {
          const prevQuillIndex = this.quill.getIndex(prevLeaf) + urlMatch.index!
          // for mboile device (keyboard selection bug)
          this.quill.removeFormat(prevQuillIndex, prevLeaf.domNode.textContent?.length ?? 0)
          this.textToUrl(prevQuillIndex, urlMatch[0])
        }
      } else {
        this.transformLeaf(currentLeaf)
      }
    }
  }
  private transformLeaf(leaf: LeafBlot) {
    try {
      const value = (leaf.value() as string) ?? ''
      const urlMatch = value.match(this.options.urlRegularExpression)
      const leafIndex = this.quill.getIndex(leaf)
      if (urlMatch) {
        this.textToUrl(leafIndex + urlMatch.index!, urlMatch[0])
      } else if (leaf.parent.domNode.localName === 'a') {
        this.quill.removeFormat(leafIndex, value.length)
      }
    } catch (e) {
      /* empty */
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
