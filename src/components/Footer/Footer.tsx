import FooterText from "./FooterText";
import FooterLink from "./FooterLink";
import { SiKofi } from "react-icons/si";
import { FaDiscord } from "react-icons/fa";
import * as Constants from "../../constants";
const Footer = () => {
  return (
    <footer className="flex h-32 w-full flex-col items-center justify-between lg:h-12 lg:flex-row">
      <div className="flex h-[33%] w-full items-center justify-center gap-6 lg:order-2">
        <FooterText pathTo="/About">About</FooterText>
        <FooterText pathTo="/Terms">Terms & Privacy</FooterText>
        <FooterText pathTo="/Contact">Contact</FooterText>
      </div>
      <div className="flex h-[33%] w-full items-center justify-center gap-6 lg:order-3">
        <div className="flex items-center justify-center gap-1">
          <FaDiscord size={26} color="#818181" />
          <FooterLink pathTo="https://discord.gg/UH6eUVQQMX">
            {Constants.NAV_LABELS.DISCORD}
          </FooterLink>
        </div>
        <div className="flex items-center justify-center gap-1">
          <SiKofi size={24} color="#818181" />
          <FooterLink pathTo="https://ko-fi.com/">
            {Constants.NAV_LABELS.SUPPORTUS}
          </FooterLink>
        </div>
      </div>
      <div className="flex h-[33%] w-full items-center justify-center gap-1 lg:order-1">
        <p className="text-font-primary font-sans">
          © Luki Badge Hub - Created By
        </p>
        <FooterLink pathTo="https://github.com/pofanek">Pofanek</FooterLink>
      </div>
    </footer>
  );
};

export default Footer;
