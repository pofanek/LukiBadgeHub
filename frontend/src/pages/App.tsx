import { Navbar, HomepageContent, Footer } from "../components";

function App() {
  return (
    <div className="flex h-screen flex-col bg-cover bg-center bg-no-repeat">
      <Navbar activeTab="Home" />
      <HomepageContent />
      <Footer />
    </div>
  );
}

export default App;
