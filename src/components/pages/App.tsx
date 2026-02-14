import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import HomepageContent from "../HomepageContent/HomepageContent";
function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar activeTab="Home" />
      <HomepageContent />
      <Footer />
    </div>
  );
}

export default App;
