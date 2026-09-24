import { Link, useLocation } from "react-router-dom"
import Links from "../../data/links";


const Nav = () => {
  const pathname = useLocation().pathname;
  return (
    <nav className="flex gap-8">
      {Links.Links.map((link, index) => {
        return (
          <Link to={link.path} key={index} className={`${link.path === pathname && "text-accent border-b-2 border-accent"} capitalize font-medium hover:text-accent transition-all`}>
            {link.name}
          </Link>
        )
      })}
      {/* <a href="/portfolio">Portfolio</a> */}
    </nav>
  )
}

export default Nav
