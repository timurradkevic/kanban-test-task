import { Route, Routes } from 'react-router-dom';
import { HomePage } from '@pages/home';
import { BoardPage } from '@pages/board';
import { ToastManager } from '@app/providers/ToastManager';

export const App = () => {
  return (
    <>
      <ToastManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/board/:boardId" element={<BoardPage />} />
      </Routes>
    </>
  );
};
