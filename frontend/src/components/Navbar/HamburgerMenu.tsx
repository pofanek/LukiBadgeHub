import { CardItem } from "./";
type HamburgerMenuProps = {
  value: boolean;
  setter: React.Dispatch<React.SetStateAction<boolean>>;
};
const HamburgerMenu = ({ value, setter }: HamburgerMenuProps) => {
  return (
    <>
      <div
        className={`bg-surface-raised border-border fixed top-0 right-0 z-10 h-full w-54 pt-25 shadow-black transition-transform duration-200 ease-in-out ${
          value ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <ul className="h-full w-full overflow-x-hidden overflow-y-auto">
          <li>
            <CardItem pathTo={`/Games`} className="h-15">
              Games
            </CardItem>
          </li>
          <li>
            <CardItem className="h-15" pathTo={`/Rankings`}>
              Rankings
            </CardItem>
          </li>
          <li>
            <CardItem className="h-15" pathTo={`/Settings`}>
              Settings
            </CardItem>
          </li>
          <li>
            <CardItem
              isLink={true}
              pathTo={"https://discord.gg/UH6eUVQQMX"}
              className="h-15"
            >
              Discord
            </CardItem>
          </li>
          <li>
            <CardItem
              isLink={true}
              pathTo={"https://ko-fi.com/"}
              className="h-15"
            >
              Support Us!
            </CardItem>
          </li>
          <li>
            <CardItem pathTo={`/Logout`} lastItem={true} className="h-15">
              Logout
            </CardItem>
          </li>
        </ul>
      </div>
      {value && (
        <div
          className="fixed inset-0 z-9 bg-black/15"
          onClick={() => setter(false)}
        ></div>
      )}
    </>
  );
};

export default HamburgerMenu;
