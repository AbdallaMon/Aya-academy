import { NavAction, NavLink } from "./types";

export const navLinks: NavLink[] = [
  { text: "Home", href: "/#home" },
  { text: "Levels", href: "#levels" },
  { text: "How it works", href: "#how-it-works" },
  { text: "About", href: "#about" },
  { text: "Pricing", href: "#pricing" },
];

export const navActions: NavAction[] = [
  {
    text: "Login",
    href: "/login",
    type: "link",
  },
  {
    text: "Sign Up",
    href: "/signup",
    type: "button",
  },
];
