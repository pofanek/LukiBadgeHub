type NavbarImageProps = {
  image: string;
  alt: string;
  className?: string;
  onClick?: () => void;
};
const NavbarImage = ({
  image,
  alt,
  className = "",
  onClick,
}: NavbarImageProps) => {
  return (
    <img
      src={image}
      alt={alt}
      className={`relative h-12.5 w-12.5 rounded-4xl ${className}`}
      onClick={onClick}
    />
  );
};

export default NavbarImage;
