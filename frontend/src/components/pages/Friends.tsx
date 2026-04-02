import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import HomepageContent from "../HomepageContent/HomepageContent";

function Friends() {
  return (
    <div className="flex h-screen flex-col bg-cover bg-center bg-no-repeat">
      <Navbar activeTab="Home" />
      <HomepageContent />
      <Footer />
    </div>
  );
}

export default Friends;
