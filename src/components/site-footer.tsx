import { Link } from "@tanstack/react-router";
import { BrandLogo } from "./brand-logo";
import { Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="space-y-3">
          <BrandLogo size="md" />
          <p className="text-sm text-muted-foreground">
            AI-powered study companion built for NCC Level 4 Computing students.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" className="hover:text-foreground">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-foreground">How It Works</a></li>
            <li><Link to="/login" className="hover:text-foreground">Login</Link></li>
            <li><Link to="/register" className="hover:text-foreground">Register</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@nccsmartprep.app</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Copyright © {new Date().getFullYear()} NCC SmartPrep. All rights reserved.
      </div>
    </footer>
  );
}
