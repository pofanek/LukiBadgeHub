import { Navbar, ContactContent, Footer } from "../components";

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
