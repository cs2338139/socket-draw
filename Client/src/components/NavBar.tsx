import { Link } from "react-router-dom";
import { Button } from "@mui/material";

function NavBar() {
    return (
        <nav className="px-10 py-5 flex gap-2 border border-gray-600 bg-slate-600">
            <Link to="/">
                <Button variant="contained">Home</Button>
            </Link>
            <Link to="/about">
                <Button variant="contained">About</Button>
            </Link>
        </nav >
    );
}

export default NavBar;