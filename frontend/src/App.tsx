import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./globals.css";
import LenisScroll from "./components/LenisScroll";
import Generate from "./pages/Generate.tsx";
import MyGenerations from "./pages/MyGenerations";
import YtPerview from "./pages/YtPerview";
import Login from "./components/Login";

export default function App() {
    return (
        <>
            <LenisScroll />
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/generate" element={<Generate />} />
                <Route path="/generate/:id" element={<Generate />} />
                <Route path="/my-generation" element={<MyGenerations />} />
                <Route path="/preview" element={<YtPerview />} />
                <Route path="/login" element={<Login />} />

            </Routes>
            <Footer />
        </>
    );
}