"use client";
// import { UserProps } from "@/types/user";
import { VideoType } from "@/types/videoType";
import React, { createContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";


interface Comment {
  id: number | string;
  contentId: string; // videoId
  userId: number | string;
  username: string;
  comment: string;
  createdAt: string | Date;
}


interface AppContextProps {
  // isDark: boolean;
  // setIsDark: (isDark: boolean) => void;
  isList: boolean;
  setIsList: (isList: boolean) => void;
  videos: VideoType[];
  setVideos: (videos: VideoType[]) => void;
  selectedVideo: VideoType | null;
  setSelectedVideo: (selVideo: VideoType) => void;
  // user: UserProps;
  // setUser: (user: UserProps) => void;
  user: any;
  setUser: (user: any) => void;
  cart: any[]//UserProps;
  setCart: (cart: any[]) => void;
  isModal: boolean;
  setIsModal: (isModal: boolean) => void;
  useMock: boolean;
  setUseMock: (useMock: boolean) => void;
  comments : any ;
  setComments : (comments : any) => void;
  checkoutData: any;
  setCheckoutData: (data: any) => void;
}

export const AppContext = createContext<AppContextProps | null>(null);

export const AppContextProvider: React.FC<any> = ({ children }) => {
  const { data: session, status } = useSession();
  // const [isDark, setIsDark] = useState(false);
  const [isList, setIsList] = useState(true);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [user, setUser] = useState<any>({ 
    name: "visitor", 
    id: "nil", 
    email: "nil", 
    avatarUrl: "https://res.cloudinary.com/dc5khnuiu/image/upload/v1752627019/uxokaq0djttd7gsslwj9.png", 
    role: "user", 
    contact: "xxxx",
    walletBalance: 0,
    walletCurrency: "₦"
  });
  const [cart, setCart] = useState<any[]>([]);
  const [isModal, setIsModal] = useState(false);
  const [useMock, setUseMock] = useState(true);
  const [comments, setComments] = useState([])
  const [checkoutData, setCheckoutData] = useState<any>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        avatarUrl: session.user.avatarUrl ?? session.user.image,
        role: session.user.role,
        school: session.user.school,
      });
    }

    if (status === "unauthenticated") {
      setUser({ name: "visitor", id: "nil", email: "nil", role: "user" });
    }
  }, [session, status]);

  const appContextValues: AppContextProps = {
    // isDark,
    // setIsDark,
    isList,
    setIsList,
    videos,
    setVideos,
    comments,
    setComments,
    selectedVideo,
    setSelectedVideo,
    user,
    setUser,
    cart,
    setCart,
    isModal,
    setIsModal,
    useMock,
    setUseMock,
    checkoutData,
    setCheckoutData,
  };

  return (
    <AppContext.Provider value={appContextValues}>
      {children}
    </AppContext.Provider>
  );
};
