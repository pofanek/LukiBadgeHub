import { Navbar, ContactContent, Footer } from "../components";

function Contact() {
  return (
    <div className="flex h-screen flex-col">
      <Navbar activeTab="Home" />
      <ContactContent />
      <Footer />
    </div>
  );
}

export default Contact;
