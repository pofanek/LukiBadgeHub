type NavbarImageProps = {
  image: string;
  alter: string;
  className?: string;
  onClick?: () => void;
};
const NavbarImage = ({
  image,
  alter,
  className = "",
  onClick,
}: NavbarImageProps) => {
  return (
    <img
      src={image}
      alt={alter}
      className={`relative h-12.5 w-12.5 rounded-4xl ${className}`}
      onClick={onClick}
    />
  );
};

export default NavbarImage;
