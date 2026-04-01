type props = {
  children: React.ReactNode;
};

// UI for 1 window main page content.
const FocusContent = ({ children }: props) => {
  return (
    <main className="flex flex-1 items-center justify-center">{children}</main>
  );
};

export default FocusContent;
