import { ChatHeader, ChatBubble, ChatInput } from "@/components/myComponents/subs/chatsubs"
import { ScrollArea } from "@/components/ui/scroll-area"

const Chat = () => {
  return (
    <div className="flex flex-1 flex-col relative w-full hscreen">
      <ChatHeader style="h-14 mt-1 w-full flex justify-center items-center overflow-clip /bg-red-500 bg-secondary/30 rounded-sm" />
      <ScrollArea className="flex-1 flex /overflow-y-auto flex-col h-full /h-[75vh] w-full max-w-5xl self-center contain-size">
        <ChatBubble user={true} chats="more props text" />
        <ChatBubble user={false} chats="" />
        <ChatBubble user={false} chats="more props text" />
        <ChatBubble user={true} chats="more props text hjfksk jodosp" />
        <ChatBubble user={false} chats="more props text" />
        <ChatBubble user={true} chats="" />
        <ChatBubble user={false} chats="more props text" />
        <ChatBubble user={true} chats="more props text hjfksk jodosp" />
        <ChatBubble user={false} chats="more props text" />
        <ChatBubble user={true} chats="" />
        <ChatBubble user={true} chats="more props text" />
        <ChatBubble user={false} chats="" />
        <ChatBubble user={false} chats="more props text" />
        <ChatBubble user={true} chats="more props text hjfksk jodosp" />
        <ChatBubble user={false} chats="more props text" />
        <ChatBubble user={true} chats="" />
        <ChatBubble user={false} chats="more props text" />
        <ChatBubble user={false} chats="more props text" />
        <ChatBubble user={true} chats="" />
        <ChatBubble user={false} chats="more props text" />
        <ChatBubble user={true} chats="more props text hjfksk jodosp" />
        <ChatBubble user={false} chats="more props text" />
        <ChatBubble user={true} chats="" />
        <ChatBubble user={true} chats="more props text" />
        <ChatBubble user={false} chats="" />
        <ChatBubble user={false} chats="more props text" />
        <ChatBubble user={true} chats="more props text hjfksk jodosp" />
        <ChatBubble user={true} chats="more props text hjfksk jodosp" />
        <ChatBubble user={false} chats="more props text" />
        <ChatBubble user={true} chats="" />
      </ScrollArea>
      <ChatInput style="w-full h-[50px] flex justify-center items-center bg-secondary/30 rounded-sm" />
    </div>
  )
}

export default Chat
