type NavbarImageProps = {
  image: string;
  alter: string;
  className?: string;
};
const NavbarImage = ({ image, alter, className = "" }: NavbarImageProps) => {
  return (
    <img
      src={image}
      alt={alter}
      className={`relative h-12.5 w-12.5 rounded-4xl ${className}`}
    />
  );
};

export default NavbarImage;
