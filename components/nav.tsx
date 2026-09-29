"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import Links, { PortalLinks } from "@/data/links";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"


const Nav = () => {
  const pathname = usePathname();
  const allLinks = [...Links.Links, ...PortalLinks];
  const visibleLinks = allLinks.slice(0, 5);
  const overflowLinks = allLinks.slice(5);
  const isActive = (path: string) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));

  return (
    <nav className="flex gap-8">
      {visibleLinks.map((link) => (
          <Link href={link.path} key={link.path} className={`${isActive(link.path) ? "text-accent border-b-2 border-accent" : ""} capitalize font-medium hover:text-accent transition-all`}>
            {link.name}
          </Link>
      ))}
      {overflowLinks.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className={`inline-flex items-center gap-1 capitalize font-medium transition-all hover:text-accent ${overflowLinks.some((link) => isActive(link.path)) ? "text-accent" : ""}`}>
            More <ChevronDown size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[70vh] min-w-48 overflow-y-auto">
            {overflowLinks.map((link) => (
              <DropdownMenuItem key={link.path} asChild>
                <Link href={link.path} className={`capitalize ${isActive(link.path) ? "text-accent" : ""}`}>
                  {link.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {/* <a href="/portfolio">Portfolio</a> */}
    </nav>
  )
}

export default Nav
