import { Button } from "@/components/ui/button"
import placeholder from "../../assets/placeholderFemale.webp"
import { BiRightArrow } from "react-icons/bi";
import { FaList } from "react-icons/fa"
import { Input } from '@/components/ui/input';

export const ChatHeader = (props : {style : string,}) => {
  return (
    <div className={props.style}>
      <div className="w-full flex flex-row justify-between">
        <div className="flex flex-row">
            <div className="relative w-14 h-14">
                <div><img src={placeholder} alt="" className="w-12 h-12 rounded-full mx-2" /></div>
                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse absolute right-0 top-0"></div>
            </div>
            <div className="flex flex-col px-3 ">
                <div className="text-xl font-semibold">Friends Name</div>
                <div className="text-sm">placeholder</div>
            </div>
        </div>
        <Button variant={"ghost"} className="flex justify-center items-center h-14 w-14 text-3xl"><FaList className="/text-2xl /h-20" /></Button>
      </div>
    </div>
  )
}

export const ChatBubble = (props : {user: boolean, chats: string,}) => {
  const order =  (props.user ? "order-2": "order-none")
  const align =  (props.user ? "flex flex-row w-full px-2 my-2 justify-end": "flex flex-row w-full px-2 my-2 justify-start")
  const bubble =  (props.user ? "w-full flex-wrap bg-accent-tertiary/80 px-4 py-2 /mb-2 rounded-b-xl rounded-l-xl dark:text-background text-black": "w-full flex-wrap bg-accent-tertiary/80 px-4 py-2 /mb-2 rounded-b-xl rounded-r-xl text-black")
    return (
      <div className={align}>
        <div className={order}><img src={placeholder} alt="" className="w-12 h-12 rounded-full mx-2" /></div>
        <div className="flex flex-col items-center max-w-[60%]">
            <div className={bubble}>chats chats chats {props.chats}</div>
            <div className="text-sm w-full text-end text-foreground/70 my-1">time</div>
        </div>
      </div>
    )
  }

export const ChatInput = (props : {style: string}) => {
return (
    <div className={props.style}>
        <div className="flex flex-row w-full max-w-[360px] px-2 /h-full justify-center items-center">
            <Input className="flex-1 bg-secondary overflow-auto w-full h-[2.5rem] max-h-[4rem] border-none outline-none text-nowrap" />
            <Button className="w-14 rounded-lg text-2xl bg-accent top-0 right-0 h-full -translate-x-2 hover:text-accent"><BiRightArrow /></Button>
        </div>
    </div>
)
}

export const CommunitySeach = () => {
    return (
      <div>
        <div className="flex flex-row">
            <Input placeholder="user" className="flex-1 bg-secondary overflow-auto w-full h-[2.5rem] max-h-[4rem] border-none outline-none text-nowrap" />
            <Button className="w-14 rounded-lg text-2xl bg-accent top-0 right-0 h-full -translate-x-2 hover:text-accent"><BiRightArrow /></Button>
        </div>
      </div>
    )
  }


export const ChatAccount = () => {
return (
        <div className="flex flex-row p-1 hover:bg-secondary w-[448px]">
            <div className="relative w-14 h-14">
                <div><img src={placeholder} alt="" className="w-12 h-12 rounded-full mx-2" /></div>
                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse absolute right-0 top-0"></div>
            </div>
            <div className="flex flex-1 flex-col px-2">
                <div className="text-lg font-semibold">Users Name</div>
                <div className="text-sm text-foreground/80">hello</div>
            </div>
            <div className="text-sm text-foreground/70 w-20"> time</div>
        </div>
)
}