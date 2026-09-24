"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Links from "@/data/links";
import { useAppContext } from "@/hooks/useAppContext";


const Nav = () => {
  const pathname = usePathname();
  const { user } = useAppContext();
  const role = String(user?.role ?? "").toLowerCase();
  const portal = ["student", "parent", "teacher", "staff", "bursar", "admin"].includes(role) ? role : null;
  return (
    <nav className="flex gap-8">
      {Links.Links.map((link, index) => {
        return (
          <Link href={link.path} key={index} className={`${link.path === pathname && "text-accent border-b-2 border-accent"} capitalize font-medium hover:text-accent transition-all`}>
            {link.name}
          </Link>
        )
      })}
      {portal && <Link href={`/${portal}`} className="font-medium capitalize text-accent hover:underline">{portal} portal</Link>}
      {/* <a href="/portfolio">Portfolio</a> */}
    </nav>
  )
}

export default Nav
