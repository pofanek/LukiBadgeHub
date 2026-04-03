import { Navbar, ContactContent, Footer } from "../components";

function Profile() {
  return (
    <div className="flex h-screen flex-col">
      <Navbar activeTab="Home" />
      <ContactContent />
      <Footer />
    </div>
  );
}

export default Profile;
