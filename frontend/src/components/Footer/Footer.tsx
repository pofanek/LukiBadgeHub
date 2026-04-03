import { FooterText, FooterLink } from "./";
import { SiKofi } from "react-icons/si";
import { FaDiscord } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="flex h-32 w-full flex-col items-center sm:h-auto sm:flex-row sm:items-center sm:px-0 sm:py-2">
      <div className="flex h-[33%] w-full min-w-69 items-center justify-center gap-6 sm:order-2 sm:h-auto">
        <FooterText pathTo="/About">About</FooterText>
        <FooterText pathTo="/Terms">Terms & Privacy</FooterText>
        <FooterText pathTo="/Contact">Contact</FooterText>
      </div>

      <div className="flex h-[33%] w-full min-w-34 items-center justify-center gap-6 sm:order-3 sm:mr-7 sm:h-auto sm:justify-end">
        <div className="flex flex-row gap-6 sm:flex-col sm:gap-1 lg:flex-row lg:gap-6">
          <a
            href="https://discord.gg/UH6eUVQQMX"
            className="flex items-center justify-center gap-1"
          >
            <FaDiscord size={26} color="#818181" />
            <FooterLink>Discord</FooterLink>
          </a>
          <a
            href="https://ko-fi.com/"
            className="flex items-center justify-center gap-1"
          >
            <SiKofi size={24} color="#818181" />
            <FooterLink>Support Us!</FooterLink>
          </a>
        </div>
      </div>

      <div className="flex h-[33%] w-full min-w-48 items-center justify-center sm:order-1 sm:ml-7 sm:h-auto sm:justify-start sm:pr-7 lg:pr-0">
        <div className="flex flex-row items-center gap-1 text-center sm:flex-col md:flex-col lg:flex-row lg:gap-1.5">
          <span className="text-font-primary font-sans">© Luki Badge Hub</span>
          <span className="text-font-primary flex items-center gap-1.5 font-sans">
            - Created By
            <a href="https://github.com/pofanek">
              <FooterLink>Pofanek</FooterLink>
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
