import Link from "next/link"

const Notfound = () => {
  return (
    <div className="">
      <h1>Page Not Found</h1>
      <Link href="/"> Go Back To The Home Page</Link> 
    </div>
  )
}

export default Notfound
