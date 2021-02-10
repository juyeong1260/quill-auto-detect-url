import dynamic from 'next/dynamic'

const Comp = dynamic(() => import('../components/Editor'), { ssr: false })

const IndexPage = () => {
  return (
    <div>
      <Comp />
    </div>
  )
}

export default IndexPage
