import React from "react";
import Footer from "./Footer";
import Header from "./Header";

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Header />
      <div className="m-12 min-h-screen max-w-2xl mx-auto">{children}</div>
      <Footer />
    </div>
  );
};

export default Wrapper;
