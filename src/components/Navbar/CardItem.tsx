type CardItemProps = {
  children: string;
  lastItem?: boolean;
  className?: string;
};

const CardItem = ({
  children,
  lastItem = false,
  className = "",
}: CardItemProps) => {
  return (
    <>
      <li
        className={`${className} text-font-primary hover:text-hover active:text-hover hover:bg-effect-glass active:bg-effect-glass flex w-full cursor-pointer items-center justify-center rounded-lg transition-all duration-200`}
      >
        {children}
      </li>
      <div
        className={`bg-border m-2 h-0.5 w-full ${lastItem ? "hidden" : "block"}`}
      ></div>
    </>
  );
};

export default CardItem;
