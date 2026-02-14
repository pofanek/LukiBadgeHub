type CardItemProps = {
  children: string;
  lastItem?: boolean;
  className?: string;
  profileMenuOpen?: boolean;
};

const CardItem = ({
  children,
  lastItem = false,
  className = "",
  profileMenuOpen,
}: CardItemProps) => {
  return (
    <>
      <div
        className={`${className} text-font-primary hover:text-hover active:text-hover hover:bg-effect-glass active:bg-effect-glass flex w-full items-center justify-center rounded-lg transition-all duration-200 ${profileMenuOpen ? "cursor-pointer" : "cursor-default"}`}
      >
        {children}
      </div>
      <div
        className={`bg-border m-2 h-0.5 w-full ${lastItem ? "hidden" : "block"}`}
      ></div>
    </>
  );
};

export default CardItem;
