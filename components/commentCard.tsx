import { normalizeDateTime } from "@/utils";
import axios from "axios";
import { useAppContext } from "@/hooks/useAppContext";
import { Button } from '@/components/ui/button'

const CommentCard = (prop: { name: string, createdAt: string, comment: string, id: string }) => {
  const { user } = useAppContext();

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`/api/dbhandler?model=comments&id=${prop.id}`);
      if (response.status === 200) {
        alert("Comment deleted");
        // You may want to reload the comments list here
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-full mb-1 py-1">
      <div className="w-full bg-m-hover p-1 flex justify-between items-center">
        <div>
          <span className="font-semibold italic pr-2">{prop.name}</span>
          <span className="text-xs">[{normalizeDateTime(prop.createdAt)}]</span>
        </div>
        {(user.role === "admin" || user.role === "moderator") && (
          <Button variant={"destructive"} size={"sm"} onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>
      <p className="bg-m-contrast p-1 text-sm">{prop.comment}</p>
    </div>
  );
};

export default CommentCard;

