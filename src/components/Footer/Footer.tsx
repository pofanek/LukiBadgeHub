import FooterText from "./FooterText";
import FooterLink from "./FooterLink";
import { discord, kofi } from "../../assets";
import * as Constants from "../../constants";
const Footer = () => {
  return (
    <footer className="flex h-32 w-full flex-col items-center justify-between lg:h-12 lg:flex-row">
      <div className="flex h-[33%] w-full items-center justify-center gap-6 lg:order-2">
        <FooterText>About</FooterText>
        <FooterText>Terms & Privacy</FooterText>
        <FooterText pathTo="/Contact">Contact</FooterText>
      </div>
      <div className="flex h-[33%] w-full items-center justify-center gap-6 lg:order-3">
        <div className="flex items-center justify-center gap-1">
          <img src={discord} alt="discord" className="h-6 w-6 object-cover" />
          <FooterLink pathTo="https://discord.gg/UH6eUVQQMX">
            {Constants.NAV_LABELS.DISCORD}
          </FooterLink>
        </div>
        <div className="flex items-center justify-center gap-1">
          <img src={kofi} alt="kofi" className="h-6 w-6 object-cover" />
          <FooterLink pathTo="https://ko-fi.com/">
            {Constants.NAV_LABELS.SUPPORTME}
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
