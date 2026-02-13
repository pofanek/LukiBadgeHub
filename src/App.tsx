import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import HomepageContent from "./components/HomepageContent/HomepageContent";
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
