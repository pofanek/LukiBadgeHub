import { Divider } from "../UI";
import { CardItem } from "./";
import Title from "../Navbar/Title";
import { MENU_SECTIONS } from "./menuSections";
type HamburgerMenuProps = {
  value: boolean;
  setter: React.Dispatch<React.SetStateAction<boolean>>;
  isLoggedIn: boolean;
};

const HamburgerMenu = ({ value, setter, isLoggedIn }: HamburgerMenuProps) => {
  const visibleSections = isLoggedIn
    ? MENU_SECTIONS
    : MENU_SECTIONS.filter((_, i) => i !== 1); // hide index 1 - account related
  return (
    <>
      <div
        className={`bg-surface-raised border-border fixed top-0 right-0 left-0 z-10 max-h-screen overflow-y-auto border-b px-7 pt-7 pb-9 shadow-black backdrop-blur-md transition-transform duration-400 ease-in-out ${
          value ? "translate-y-0" : "-translate-y-[110%]"
        }`}
      >
        <ul className="w-full">
          <li className="relative flex h-16 w-full items-center">
            <div className="absolute left-1/2 -translate-x-1/2">
              <Title alwaysExpandText longNavbar={false} />
            </div>
          </li>

          <div className="mb-4" />

          {visibleSections.map((section, sectionIndex) => {
            const globalOffset = MENU_SECTIONS.slice(0, sectionIndex).reduce(
              (acc, s) => acc + s.length,
              0,
            );

            return (
              <li key={sectionIndex}>
                <ul>
                  {section.map(({ label, pathTo, isLink, icon }, i) => (
                    <li key={pathTo}>
                      <CardItem
                        pathTo={pathTo}
                        className="h-15"
                        index={globalOffset + i}
                        open={value}
                        isLink={isLink}
                        icon={icon}
                      >
                        {label}
                      </CardItem>
                    </li>
                  ))}
                </ul>
                {sectionIndex < visibleSections.length - 1 && <Divider />}
              </li>
            );
          })}
        </ul>
      </div>

      <div
        className={`fixed inset-0 top-15 z-9 transition-all duration-350 ${
          value
            ? "pointer-events-auto bg-black/45"
            : "pointer-events-none bg-transparent"
        }`}
        onClick={() => setter(false)}
      />
    </>
  );
};

export default HamburgerMenu;
