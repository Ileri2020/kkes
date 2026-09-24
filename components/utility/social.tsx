import Link from "next/link"
import { FaGithub, FaLinkedin, FaFacebook, FaWhatsapp, FaInstagram, FaEnvelope,} from "react-icons/fa"
import { BiLogoUpwork} from "react-icons/bi"

const socials = [
    { icon: <FaGithub />, path: ""},
    { icon: <FaLinkedin />, path: "www.linkedin.com/in/ololade-adepoju-0501b9284"},
    { icon: <FaFacebook />, path: "https://www.facebook.com/profile.php?id=100075397718948"},
    { icon: <FaWhatsapp />, path: "https://wa.link/24rg59"},
    { icon: <FaInstagram />, path: "https://www.instagram.com/adepoju1481?igsh=cTI4dGFzODgyd3Jy"},
    { icon: <FaEnvelope />, path: "mailto:adepojuololade2020@gmail.com?subject=Hello%20from%20your%20resume"},
    { icon: <BiLogoUpwork />, path: "https://www.upwork.com/freelancers/~017d60f162181ee100"},
]

const Social = ( prop: { containerStyles : string, iconStyles: string} ) => {
  return (
    <div className={prop.containerStyles}>
      {socials.map((item, index) => {
        return (
            <Link key={index} href={item.path} className={prop.iconStyles}>
                {item.icon}
            </Link> 
        );
      })}
    </div>
  )
}

export default Social




