import { ScrollArea } from "@frontend/components/ScrollArea";
import { Outlet } from 'react-router';

import { Footer } from './components/Footer';
import { Header } from './components/Header';

export const HomeLayout = () => (
  <ScrollArea orientation="vertical" className="h-screen">
    <Header />
    <Outlet />
    <Footer />
  </ScrollArea>
);
