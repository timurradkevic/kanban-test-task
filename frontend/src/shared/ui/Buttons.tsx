import { ChevronLeftIcon, Copy, RotateCcw } from 'lucide-react';
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
      className="bg-blue-500 text-white rounded hover:bg-blue-600 hover:cursor-pointer w-8 h-8 flex items-center justify-center"
    >
      <ChevronLeftIcon className="inline-block w-4 h-4 mr-1" />
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
