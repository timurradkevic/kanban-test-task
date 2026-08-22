import { BackButton, ReloadButton } from '@/shared/ui/Buttons';

export const NotFound = ({
  title,
  code,
  navigate,
  refetch,
}: {
  title: string;
  code: number;
  navigate: (path: string) => void;
  refetch: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-8xl font-bold mb-2">{code}</h1>
      <h1 className="text-red-500 text-2xl justify-content font-bold mb-2">
        {title}
      </h1>
      <div className="flex items-start">
        <BackButton navigate={navigate} />
        <ReloadButton refetch={refetch} />
      </div>
    </div>
  );
};
