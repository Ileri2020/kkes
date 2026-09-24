import { Link } from "react-router-dom"

const Notfound = () => {
  return (
    <div className="">
      <h1>Page Not Found</h1>
      <Link to="/"> Go Back To The Home Page</Link> 
    </div>
  )
}

export default Notfound
