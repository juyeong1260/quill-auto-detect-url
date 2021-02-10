import React, { useEffect, useRef } from 'react'
import Quill from 'quill'
import QuillAutoDetectUrl, { QuillAutoDetectUrlOptions } from 'quill-auto-detect-url'
import 'quill/dist/quill.snow.css'

Quill.register('modules/autoDetectUrl', QuillAutoDetectUrl)

const editor: React.FC = () => {
  const quillRef = useRef<Quill | null>(null)

  useEffect(() => {
    quillRef.current = new Quill('#editor', {
      theme: 'snow',
      modules: {
        autoDetectUrl: {
          urlRegularExpression: /(https?:\/\/|www\.)[\w-.]+\.[\w-.]+[\S]+/i,
        } as QuillAutoDetectUrlOptions,
      },
    })
  }, [])

  return <div id="editor"></div>
}

export default editor
