import { useState } from 'react';
import { ApiKeyGuard } from './components/ApiKeyGuard';
import { Sidebar } from './components/Sidebar';
import { StudyAssistant } from './components/StudyAssistant';
import { HomeworkScanner } from './components/HomeworkScanner';
import { DiagramGenerator } from './components/DiagramGenerator';
import { LocalResources } from './components/LocalResources';
import { TTSReader } from './components/TTSReader';

export type Tab = 'assistant' | 'scanner' | 'diagrams' | 'resources' | 'reader';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('assistant');

  return (
    <ApiKeyGuard>
      <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-hidden flex flex-col relative">
          {activeTab === 'assistant' && <StudyAssistant />}
          {activeTab === 'scanner' && <HomeworkScanner />}
          {activeTab === 'diagrams' && <DiagramGenerator />}
          {activeTab === 'resources' && <LocalResources />}
          {activeTab === 'reader' && <TTSReader />}
        </main>
      </div>
    </ApiKeyGuard>
  );
}
