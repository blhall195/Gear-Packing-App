import { HashRouter, Routes, Route } from 'react-router-dom';
import { TripProvider } from '../context/TripContext';
import { GearProvider } from '../context/GearContext';
import Layout from './Layout';
import Questionnaire from './questionnaire/Questionnaire';
import PackingList from './packing-list/PackingList';
import GearEditor from './gear-editor/GearEditor';

export default function App() {
  return (
    <GearProvider>
    <TripProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Questionnaire />} />
            <Route path="/list" element={<PackingList />} />
            <Route path="/editor" element={<GearEditor />} />
          </Route>
        </Routes>
      </HashRouter>
    </TripProvider>
    </GearProvider>
  );
}
