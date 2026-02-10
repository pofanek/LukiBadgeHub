type NavbarImageProps = {
  image: string;
  alter: string;
};
const NavbarImage = ({ image, alter }: NavbarImageProps) => {
  return <img src={image} alt={alter} className="h-12.5 w-12.5 rounded-4xl" />;
};

export default NavbarImage;
