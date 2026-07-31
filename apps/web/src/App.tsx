import { Route, Routes } from "react-router";

function HomePage() {
  return <div className="p-8">サークル会計アプリ（セットアップ中）</div>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}
