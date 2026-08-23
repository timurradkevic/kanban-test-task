import { ChevronLeftIcon, Copy, Pen, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const ReloadButton = ({ refetch }: { refetch: () => void }) => {
  return (
    <button
      onClick={refetch}
      className="bg-blue-500 text-white rounded hover:bg-blue-600 hover:cursor-pointer w-8 h-8 flex items-center justify-center ml-2"
    >
      <RotateCcw className="inline-block w-4 h-4" />
    </button>
  );
};

export const BackButton = ({
  navigate,
}: {
  navigate: (path: string) => void;
}) => {
  return (
    <button
      onClick={() => navigate('/')}
      className="bg-blue-500 text-white rounded hover:bg-blue-600 hover:cursor-pointer w-8 h-8 flex items-center justify-center mb-2"
    >
      <ChevronLeftIcon className="inline-block w-4 h-4 mr-0.5" />
    </button>
  );
};

export const CopyButton = ({
  textToCopy,
  textLabel,
}: {
  textToCopy: string;
  textLabel: string;
}) => {
  return (
    <button
      onClick={() => {
        toast.success(`${textLabel} copied to clipboard`);
        navigator.clipboard.writeText(textToCopy);
      }}
      className="bg-blue-500 text-white rounded hover:bg-blue-600 hover:cursor-pointer w-8 h-8 flex items-center justify-center"
    >
      <Copy className="inline-block w-4 h-4" />
    </button>
  );
};

export const UpdateButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="bg-blue-500 text-white rounded hover:bg-blue-600 hover:cursor-pointer mt-2 select-none flex items-center justify-center w-8 h-8"
    >
      <Pen className="inline-block w-4 h-4" />
    </button>
  );
};

export const DeleteButton = ({
  onClick,
  isLoading,
}: {
  onClick: () => void;
  isLoading: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="bg-red-500 text-white rounded hover:bg-red-600 hover:cursor-pointer mt-2 select-none flex items-center justify-center w-8 h-8"
    >
      <Trash2 className="inline-block w-4 h-4" />
    </button>
  );
};
