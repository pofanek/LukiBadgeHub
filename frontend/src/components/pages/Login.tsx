import Title from "../Navbar/Title";
import Footer from "../Footer/Footer";
import LoginContent from "../Login/LoginContent";
function Contact() {
  return (
    <div className="flex h-screen flex-col">
      <nav className="border-border bg-surface-overlay/40 sticky z-10 mx-20 mt-7 flex h-16 max-h-16 flex-1 flex-row items-center justify-center rounded-xl border p-1 shadow-black sm:mx-20 lg:w-215 lg:self-center">
        <Title longNavbar={false} />
      </nav>
      <LoginContent />
      <Footer />
    </div>
  );
}

export default Contact;
