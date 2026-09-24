import { cn } from "@/lib/utils";

interface ProfileCardProps {
    className?: string;
    name: string;
    title: string;
    profileImage: string;
  }

  
  export const ProfileCard = ({ className, name, title, profileImage }: ProfileCardProps) => {
    return (
      <div
        className={cn(
          "relative w-56 h-64 flex flex-col items-center justify-between bg-secondary rounded-lg m-1 shadow-md shadow-accent/50 overflow-clip",
          className
        )}
      >
        <div className="h-[40%] w-full bg-accent/70 flex justify-center items-center">
          <div className="/absolute relative w-40 h-40 translate-y-10 bg-white rounded-full overflow-clip self-center flex justify-center items-center">
            <img src={profileImage} alt={`${name}'s profile`} />
          </div>
        </div>
        <div className="my-2">
          <div className="font-medium text-lg text-accent w-full text-center">Papa Oshofa</div>
          <div className="font-normal text-sm text-[#78858F]">Pastor Founder</div>
        </div>
      </div>
    );
  };
  
  