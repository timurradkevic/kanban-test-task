import { Route, Routes } from 'react-router-dom';
import { HomePage } from '@pages/home';
import { BoardPage } from '@pages/board';

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/board/:boardId" element={<BoardPage />} />
    </Routes>
  );
};
