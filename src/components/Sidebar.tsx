import { BookOpen, Camera, Image as ImageIcon, MapPin, Volume2, GraduationCap } from 'lucide-react';
import { Tab } from '../App';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'assistant', label: 'Study Assistant', icon: BookOpen },
    { id: 'scanner', label: 'Homework Scanner', icon: Camera },
    { id: 'diagrams', label: 'Diagrams & Art', icon: ImageIcon },
    { id: 'resources', label: 'Local Resources', icon: MapPin },
    { id: 'reader', label: 'Text Reader', icon: Volume2 },
  ] as const;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-sm">
          <GraduationCap size={24} />
        </div>
        <h1 className="font-bold text-xl text-gray-800 tracking-tight">SL Scholar</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 font-medium shadow-sm border border-blue-100/50' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center font-medium tracking-wide uppercase">
        Powered by Gemini
      </div>
    </div>
  );
}
