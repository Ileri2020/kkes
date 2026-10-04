"use client"

import { Button} from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import React, { useRef, LegacyRef } from 'react';
import emailjs from '@emailjs/browser';
import { SonnerDemo } from '../myUI/sonner';

const ContactForm = () => {
  
  interface RefObject<T> {
  readonly current: T | null
}
    
    const form = useRef<HTMLFormElement>(null);

  const sendEmail = (e : any) => {
    e.preventDefault();

    emailjs.sendForm('service_uce9jif', 'template_x317p9q', form.current!, {
        publicKey: 'x5CVllr3OuJKwPm0a',
    })
    .then(
      () => {
        alert('SUCCESS!');
        // toast("Message sent successfully", {
        //   description: "Thanks for reaching out to me.",
        //   action: {
        //     label: "Undo",
        //     onClick: () => console.log("Undo"),
        //   },
        // })
      },
      (error) => {
        console.log('FAILED...', error.text);
      },
    );
    
    e.target.reset();
  };




  return (
    <form ref={form  as RefObject<HTMLFormElement>} onSubmit={sendEmail} className="flex flex-col gap-6 p-10 bg-secondary rounded-xl">
        <h3 className="text-4xl text-accent mb-7 text-center md:text-start">Mail us</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input type="firstname" placeholder="Firstname" className="rounded-sm bg-background" />
        <Input type="lastname" name="user_name" placeholder="Lastname" className="rounded-sm bg-background" />
        <Input type="email" name="user_email" placeholder="Email address" className="rounded-sm bg-background" />
        <Input type="phone" placeholder="Phone number" className="rounded-sm bg-background" />
        </div>
        <Select name="service">
        <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a service" />
        </SelectTrigger>
        <SelectContent >
            <SelectGroup>
            <SelectLabel>Select a service</SelectLabel>
            <SelectItem value="wd"> Suggestion </SelectItem>
            <SelectItem value="md"> Admission </SelectItem>
            <SelectItem value="da"> Enquiry </SelectItem>
            <SelectItem value="sa"> Complain </SelectItem>
            </SelectGroup>
        </SelectContent>
        </Select>
        <Textarea className="h-[120px]" name="message" placeholder="Type your message here" />
        <Button type="submit" className="before:ani-shadow">Submit</Button>
    </form>
  )
}

export default ContactForm
