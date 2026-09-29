import {AiOutlineSearch, AiOutlineHome, AiOutlineShop, AiOutlineMan, AiOutlineContacts, AiOutlineWoman, AiOutlineProfile,} from "react-icons/ai"
import { BiPhoneCall, BiSolidContact, BiPhone,} from "react-icons/bi"
import { CiShoppingCart, CiShoppingBasket, CiShoppingTag, } from "react-icons/ci"
import { IoMdHelp } from "react-icons/io";
import { VscAccount } from "react-icons/vsc";
import { IoFastFoodOutline } from "react-icons/io5";




export default {Links : [
    {
      icon: <AiOutlineHome className="text-xl" />,
      name: "Home",
      path: "/",
    },
    {
      icon: <AiOutlineShop className="text-xl" />,
      name: "Bookshop",
      path: "/bookshop",
    },
    {
      icon: <BiPhone className="text-xl" />,
      name: "About", //mission, vission, facilities, etc
      path: "/about",
    },
    {
      icon: "blogs",//Pieces of writing with pics by student accounts
      name: "Blog", //also contains posts per account on the group for public view
      path: "/blog",
    },
    {
      icon: <BiPhone className="text-xl" />,
      name: "Results", //result of students -students only and alumnis
      path: "/result",
    },
    // {
    //   icon: <BiPhone className="text-xl" />,
    //   name: "Chat", //shows chat per person/friends
    //   path: "/chat",
    // },
    {
      icon: <BiPhone className="text-xl" />,
      name: "Community", //a social media app where you can see other students and staffs and chat them
      path: "/community",
    },
    {
      icon: <BiPhone className="text-xl" />,
      name: "Contact",
      path: "/contact",
    },
    {
      icon: <VscAccount className="text-xl" />,
      name: "Account",//sign in and out, select student, guest, staff or alumni, select school kkic, kknps, kkms
      path: "/account",
    },
  ]
}

export const PortalLinks = [
  { name: "Student portal", path: "/student" },
  { name: "Teacher portal", path: "/teacher" },
  { name: "Staff portal", path: "/staff" },
  { name: "Parent portal", path: "/parent" },
  { name: "Bursar portal", path: "/bursar" },
  { name: "Alumni", path: "/alumni" },
  { name: "Admin portal", path: "/admin" },
] as const