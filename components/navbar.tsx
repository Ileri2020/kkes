import Link from "next/link"
import Image from "next/image"
import Nav from './nav';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Sidenav from './sidenav';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Suspense } from "react"
import {AiOutlineSearch, AiOutlineHome, AiOutlineShop, AiOutlineMan, AiOutlineContacts} from "react-icons/ai"

const Navbar = () : JSX.Element => {
  return (
    <div className="w-[100vw] overflow-clip flex flex-col m-0 p-0 font-roboto_mono  shadow-lg shadow-accent">
      <header className="w-[100%] py-1 bg-background sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center h-[50px] overflow-clip">
            <Link href="/" className="flex shrink-0 justify-center items-center py-1">
              <Image src="/logo.png" alt="Kith and Kin International College logo" width={42} height={42} className="h-[42px] w-[42px] object-contain" />
            </Link>
            <div className="ml-auto lg:hidden">
              <Sidenav />
            </div>

            {/*
              <Button variant={"outline"} className="lg:hidden relative flex justify-center items-center rounded-full w-[35px] h-[35px] overflow-clip"><AiOutlineSearch className="absolute text-accent text-xl"/></Button>
            /}
            

            {/* 
              <div className="hidden lg:flex w-[23%] relative flex-row justify-center items-center my-10">
                  <Input placeholder="search" className="flex-1 border-0 dark:border-2" />
                  <Button className="absolute right-0 h-full rounded-sm text-background text-xl"><AiOutlineSearch /></Button>
              </div>
            */}

            <div className="hidden lg:flex items-center gap-8">

              <Nav/>
              {/*
                <Link href="/contact">
                  <Button className="">Hire me</Button>
                </Link>
              */}
              <ModeToggle />
            </div>
        </div>
        {/* <Advert /> */}
        
      </header>
      
    </div>
  )
}

export default Navbar
