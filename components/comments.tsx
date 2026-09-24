"use client";
import { useEffect, useState } from "react";
import CommentCard from "./commentCard";
import { useAppContext } from "@/hooks/useAppContext";
import Modal from "./modal";
import TextArea from "./textArea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
// import { commentsObject } from "@/mock/comments";
import { BASE_URL, headers } from "@/utils/constants";
import axios from "axios";
import { Button } from '@/components/ui/button'

const baseUrl = BASE_URL + "/comments";

const Comments = ( props : {videoId : string}) => {
  const { user, isModal, setIsModal, comments, setComments} = useAppContext();
  const [compComments, setCompComments] = useState<any[]>([]);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);



  const getComments = async (videoId: string) => {
    try {
      const res = await axios.get(`/api/dbhandler?model=comments&id=${videoId}`);
      //console.log(res.data)
     return res.data;
    } catch (error) {
      console.log(error);
    }
  };
  
  const postComment = async (videoId: string) => {
    try {
      const response = await axios.post('/api/dbhandler?model=comments', {
        userId: user.id,
        username: user.name,
        contentId: videoId,
        comment: comment,
      });
      return response.data;
    } catch (error) {
      console.log(error);
    }
  };



  useEffect(() => {
    // if (!selectedVideo?.id) return;
    
    getComments(props.videoId)
      .then((res) => {
        setComments([...comments, ...res]);
        setLoading(false);
      })
      .catch((err) => console.log(err));

    setCompComments(comments.filter((comment: any)=> comment.contentId === props.videoId))
    console.log('all comment',comments,'filtered comments', comments.filter((comment: any)=> comment.contentId === props.videoId))
  }, [props.videoId]);
  

  if (!props.videoId) return null;

  const validate = (): boolean => comment.length > 0;

  const showModal = () => {
    setIsModal(true);
  };

  const save = () => {
    if (!validate()) return;
    console.log('video id', props.videoId)
    postComment(props.videoId)
      .then(() => {
        // request a list of new videos, because there is no ID  in the response
        getComments(props.videoId)
          .then((res) => setComments(res.comments))
          .catch((err) => console.log(err));
      })
      .finally(() => setComment(""));
    setIsModal(false);
  };
  //for collapsible
  //isOpen state moved above the early return

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full space-y-2 px-2"
    >
      <div className="flex items-center justify-between space-x-4 px-4">
        <CollapsibleTrigger asChild>
          <div className="w-full rounded-md border px-2 py-1 /hover:bg-secondary/90">
            {loading&&compComments?.length<1 ? <div>no comment ...</div> : <CommentCard 
            name={comments?.at(0)?.name} 
            createdAt={comments?.at(0)?.createdAt} 
            comment={comments?.at(0)?.comment}
            id={comments?.at(0)?.id}
          />}
            <div><ChevronsUpDown className="h-4 w-4" /></div>
          </div>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="space-y-2">
        <Button onClick={showModal}>Add comment</Button>

        {compComments?.map((comment) => (
          <div key={comment.id}>
            <CommentCard 
              name={comment.name} 
              createdAt={comment.createdAt} 
              comment={comment.comment} 
              id={comment.id}
            />
          </div>
        ))}

        {isModal && (
          <Modal
            close={() => setIsModal(false)}
            save={save}
            isSaveAllowed={validate()}
            className="bg-secondary overflow-clip"
          >
            <h3 className="text-base my-2">
              <span className="font-semibold">@{user.name}</span>
            </h3>
            <TextArea onChange={(e) => setComment(e.target.value)} className="h-[15%]" />
          </Modal>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default Comments;
