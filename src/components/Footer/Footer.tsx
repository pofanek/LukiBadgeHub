import FooterText from "./FooterText";
import { discord, kofi } from "../../assets";
import * as Constants from "../../constants";
const Footer = () => {
  return (
    <footer className="flex h-32 w-full flex-col items-center justify-between lg:h-12 lg:flex-row">
      <div className="flex h-[33%] w-full items-center justify-center gap-6 lg:order-2">
        <FooterText>About</FooterText>
        <FooterText>Terms & Privacy</FooterText>
        <FooterText>Contact</FooterText>
      </div>
      <div className="flex h-[33%] w-full items-center justify-center gap-6 lg:order-3">
        <a
          href="https://discord.gg/UH6eUVQQMX"
          className="flex items-center justify-center gap-1"
        >
          <img src={discord} alt="discord" className="h-6 w-6 object-cover" />
          <FooterText isLink={true}>{Constants.NAV_LABELS.DISCORD}</FooterText>
        </a>
        <a
          href="https://ko-fi.com/"
          className="flex items-center justify-center gap-1"
        >
          <img src={kofi} alt="kofi" className="h-6 w-6 object-cover" />
          <FooterText isLink={true}>
            {Constants.NAV_LABELS.SUPPORTME}
          </FooterText>
        </a>
      </div>
      <div className="flex h-[33%] w-full items-center justify-center gap-1 lg:order-1">
        <p className="text-font-primary font-sans">
          © Luki Badge Hub - Created By
        </p>
        <a href="https://github.com/pofanek">
          <FooterText isLink={true}>Pofanek</FooterText>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
