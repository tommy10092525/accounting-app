import type React from "react";
import Footer from "./Footer";
import Header, { type HeaderMenuItem } from "./Header";

const Wrapper = ({
  children,
  menuItems,
}: {
  children: React.ReactNode;
  menuItems?: HeaderMenuItem[];
}) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header menuItems={menuItems} />
      <div className="mx-auto w-full max-w-md flex-1 px-6">{children}</div>
      <Footer />
    </div>
  );
};

export default Wrapper;
