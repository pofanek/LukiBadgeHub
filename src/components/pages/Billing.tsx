import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import ContactContent from "../ContactContent/ContactContent";
function Billing() {
  return (
    <div className="flex h-screen flex-col">
      <Navbar activeTab="Games" />
      <ContactContent />
      <Footer />
    </div>
  );
}

export default Billing;
