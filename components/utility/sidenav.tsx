"use client"

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CiMenuFries } from "react-icons/ci"
import Links from "../../data/links";
import { ModeToggle } from '@/components/ui/mode-toggle';

const Sidenav = () => {
    const pathname = usePathname()
  return (
    <Sheet>
        <SheetTrigger className="flex justify-center items-center">
            <CiMenuFries className="text-[32px] text-accent"/>
        </SheetTrigger>
        <SheetHeader></SheetHeader>
        <SheetTitle></SheetTitle>
        <SheetContent className="flex flex-col justify-between items-center">
            <nav className="flex flex-col justify-center items-center gap-8">
                {Links.Links.map((link, index) => {
                    return (
                        <Link href={link.path} key={index} className={`${link.path === pathname && "text-accent border-b-2 border-accent"} capitalize font-medium hover:text-accent transition-all`}>
                        {link.name}
                        </Link>
                     )
                })}
            </nav>
            <div className="my-5 w-full flex flex-row">
                <div className="flex w-full flex-1"></div>
                <ModeToggle />
            </div>
        </SheetContent>
    </Sheet>
  )
}

export default Sidenav
