import { HashRouter, Routes, Route } from 'react-router-dom';
import { TripProvider } from '../context/TripContext';
import { GearProvider } from '../context/GearContext';
import { QuestionProvider } from '../context/QuestionContext';
import Layout from './Layout';
import Questionnaire from './questionnaire/Questionnaire';
import PackingList from './packing-list/PackingList';
import GearEditor from './gear-editor/GearEditor';
import QuestionEditor from './question-editor/QuestionEditor';
import Help from './Help';

export default function App() {
  return (
    <GearProvider>
    <QuestionProvider>
    <TripProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Questionnaire />} />
            <Route path="/list" element={<PackingList />} />
            <Route path="/editor" element={<GearEditor />} />
            <Route path="/questions" element={<QuestionEditor />} />
            <Route path="/help" element={<Help />} />
          </Route>
        </Routes>
      </HashRouter>
    </TripProvider>
    </QuestionProvider>
    </GearProvider>
  );
}
