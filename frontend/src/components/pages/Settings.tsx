import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import ContactContent from "../ContactContent/ContactContent";
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
