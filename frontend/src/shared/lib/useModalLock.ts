import { useEffect } from 'react';
import { useAppDispatch } from '@app/store/hooks';
import { modalOpened, modalClosed } from '@shared/model/uiSlice';

export const useModalLock = (isOpen: boolean) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isOpen) return;

    dispatch(modalOpened());
    return () => {
      dispatch(modalClosed());
    };
  }, [isOpen, dispatch]);
};
