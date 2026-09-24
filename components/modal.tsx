import React from "react";
// import { Button } from "./button";
import { Button } from "./ui/button";

interface ModalProps {
  children?: React.ReactNode;
  className?: string;
  close: () => void;
  save: () => any
  isSaveAllowed?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  children,
  className,
  isSaveAllowed,
  close,
  save,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-10 bg-background/50">
      <div className="fixed inset-0 bg-black opacity-25" />
      <div
        className={`/fixed relative flex flex-col sm:w-full md:w-3/4 min-h-[200px] max-h-[40%] p-4 bg-m-base-end border-2 border-accent rounded-lg
         ${className ? className : ""}`}
      >
        <div className="flex-1">{children}</div>
        <div className="absolute flex gap-3 justify-center bottom-2 right-2 w-full max-w-sm">
          <Button variant="outline" onClick={close} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={!isSaveAllowed} className="flex-1">Send</Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
