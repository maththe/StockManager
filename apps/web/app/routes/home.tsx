import { Route, Routes } from "react-router";
import Login from "./users/components/login";

export default function Home() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<div>Dashboard</div>} />
    </Routes>
  );
}
