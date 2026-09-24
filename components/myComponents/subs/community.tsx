import Chat from "@/app/chat/page"
import { CommunitySeach, ChatAccount } from "./chatsubs"
import { ScrollArea } from "@/components/ui/scroll-area"

const Community = () => {
  return (
    <div className="flex flex-col lg:flex-row">
      <div className="flex flex-col gap-3 px-1 max-w-md max-h-full">
        <CommunitySeach />
        <ScrollArea className="h-[80vh]">
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
          <ChatAccount />
        </ScrollArea>
      </div>
      <div className="hidden lg:flex w-full">
        <Chat />
      </div>
    </div>
  )
}

export default Community
